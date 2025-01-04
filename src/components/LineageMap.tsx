import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Graph, Node } from '../types/GraphTypes';

interface LineageMapProps {
    title: string;
    graph: Graph;
}

interface TableLevel {
    id: string;
    level: number;
    dependencies: string[];
}

interface InferredEdge {
    id: string;
    source: string;
    target: string;
    type: string;
}

const LineageMap: React.FC<LineageMapProps> = ({ title, graph }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [expandedTables, setExpandedTables] = useState<string[]>([]);
    const [showTableRelationships, setShowTableRelationships] = useState(false);
    const [currentTransform, setCurrentTransform] = useState<d3.ZoomTransform | null>(null);


    const handleTableClick = useCallback((node: Node) => {
        if (node.type === 'table') {
            const isExpanded = expandedTables.includes(node.id);
            if (isExpanded) {
                setExpandedTables(expandedTables.filter((id) => id !== node.id));
            } else {
                setExpandedTables([...expandedTables, node.id]);
            }
        }
    }, [expandedTables]);

    // Infer table relationships from field connections
    const inferTableRelationships = (graph: Graph): InferredEdge[] => {
        const tableRelations = new Set<string>();
        const inferredEdges: InferredEdge[] = [];

        graph.edges.forEach(edge => {
            const sourceField = graph.nodes.find(n => n.id === edge.source);
            const targetField = graph.nodes.find(n => n.id === edge.target);
            
            if (sourceField?.tableId && targetField?.tableId && sourceField.tableId !== targetField.tableId) {
                const relationKey = `${sourceField.tableId}->${targetField.tableId}`;
                if (!tableRelations.has(relationKey)) {
                    tableRelations.add(relationKey);
                    inferredEdges.push({
                        id: `table-${relationKey}`,
                        source: sourceField.tableId,
                        target: targetField.tableId,
                        type: 'table-table'
                    });
                }
            }
        });

        return inferredEdges;
    };

    const getTableLevels = (graph: Graph): TableLevel[] => {
        const tableDependencies = new Map<string, Set<string>>();
        const tableNodes = graph.nodes.filter(node => node.type === 'table');
        
        tableNodes.forEach(table => {
            tableDependencies.set(table.id, new Set());
        });

        const inferredEdges = inferTableRelationships(graph);
        inferredEdges.forEach(edge => {
            const dependencySet = tableDependencies.get(edge.target);
            if (dependencySet) {
                dependencySet.add(edge.source);
            }
        });

        const levels: TableLevel[] = [];
        const processed = new Set<string>();
        let currentLevel = 0;

        while (processed.size < tableNodes.length) {
            const currentLevelTables = Array.from(tableDependencies.entries())
                .filter(([tableId, deps]) => !processed.has(tableId) && 
                    Array.from(deps).every(dep => processed.has(dep)));

            if (currentLevelTables.length === 0 && processed.size < tableNodes.length) {
                const remainingTables = tableNodes
                    .filter(table => !processed.has(table.id))
                    .map(table => table.id);
                remainingTables.forEach(tableId => {
                    levels.push({
                        id: tableId,
                        level: currentLevel,
                        dependencies: Array.from(tableDependencies.get(tableId) || [])
                    });
                    processed.add(tableId);
                });
            } else {
                currentLevelTables.forEach(([tableId, deps]) => {
                    levels.push({
                        id: tableId,
                        level: currentLevel,
                        dependencies: Array.from(deps)
                    });
                    processed.add(tableId);
                });
            }
            currentLevel++;
        }

        return levels;
    };

    useEffect(() => {
        if (!svgRef.current) return;
    
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
    
        const container = svg.append('g')
            .attr('class', 'container');
    
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 22])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
                setCurrentTransform(event.transform);
            });
    
        svg.call(zoom).on('dblclick.zoom', null); // Disable double-click zoom
    
        if (currentTransform) {
            svg.call(zoom.transform, currentTransform);
        }
    

        const tableLevels = getTableLevels(graph);
        const inferredEdges = inferTableRelationships(graph);
        
        const tableWidth = 100;
        const tableHeight = 30;
        const fieldHeight = 20;
        const fieldSpacing = -4;
        const levelPadding = 100;
        const verticalPadding = 50;

        const tableNodes = graph.nodes.filter(node => node.type === 'table');
        const fieldNodes = graph.nodes.filter(node => node.type === 'field');

        // Calculate table heights including their expanded fields
        const getTableFullHeight = (tableId: string): number => {
            if (!expandedTables.includes(tableId)) {
                return tableHeight;
            }
            const fields = fieldNodes.filter(field => field.tableId === tableId);
            return tableHeight + fieldSpacing + (fields.length * (fieldHeight + fieldSpacing));
        };

        // Group tables by level
        const tablesByLevel = new Map<number, string[]>();
        tableLevels.forEach(tableLevel => {
            if (!tablesByLevel.has(tableLevel.level)) {
                tablesByLevel.set(tableLevel.level, []);
            }
            tablesByLevel.get(tableLevel.level)?.push(tableLevel.id);
        });

        // Calculate maximum number of tables in any level
        const maxTablesInLevel = Math.max(...Array.from(tablesByLevel.values()).map(tables => tables.length));
        
        // Calculate total height needed
        const totalHeight = (maxTablesInLevel * tableHeight);
        
        // Position tables level by level with even vertical distribution
        tablesByLevel.forEach((tablesInLevel, level) => {
            const startX = level * (tableWidth + levelPadding * 2);
            const spacing = totalHeight / (tablesInLevel.length + 1);
            
            tablesInLevel.forEach((tableId, index) => {
                const node = tableNodes.find(n => n.id === tableId);
                if (node) {
                    node.x = startX;
                    node.y = 0;

                    // Position the table's fields if it's expanded
                    if (expandedTables.includes(tableId)) {
                        const tableFields = fieldNodes.filter(field => field.tableId === tableId);
                        tableFields.forEach((field, fieldIndex) => {
                            field.x = node.x;
                            field.y = node.y + tableHeight + fieldSpacing + 
                                    (fieldIndex * (fieldHeight + fieldSpacing));
                        });
                    }
                }
            });
        });

        tablesByLevel.forEach((tablesInLevel, level) => {
            const startX = level * (tableWidth + levelPadding * 2);
            let levelStartY = verticalPadding; // Start each level at the top independently
        
            tablesInLevel.forEach((tableId, index) => {
                const node = tableNodes.find(n => n.id === tableId);
                if (node) {
                    node.x = startX;
                    node.y = levelStartY;
        
                    // Calculate the height of this table
                    const tableFullHeight = getTableFullHeight(tableId);
        
                    // Position the table's fields if it's expanded
                    if (expandedTables.includes(tableId)) {
                        const tableFields = fieldNodes.filter(field => field.tableId === tableId);
                        tableFields.forEach((field, fieldIndex) => {
                            field.x = node.x;
                            field.y = node.y + tableHeight + fieldSpacing +
                                      (fieldIndex * (fieldHeight + fieldSpacing));
                        });
                    }
        
                    // Update `levelStartY` for the next table in the same level
                    if (index < tablesInLevel.length - 1) {
                        levelStartY += tableFullHeight + verticalPadding * 2;
                    }
                }
            });
        });
        
        

        // Rest of the rendering code remains the same...
        const visibleNodes = graph.nodes.filter((node) => {
            if (node.type === 'table') return true;
            return node.type === 'field' && node.tableId && expandedTables.includes(node.tableId);
        });

        const nodeGroups = container
            .selectAll('g.node')
            .data(visibleNodes, (d: any) => d.id)
            .join('g')
            .attr('class', 'node')
            .attr('transform', (d) => `translate(${d.x},${d.y})`);

        nodeGroups
            .append('rect')
            .attr('width', (d) => d.type === 'table' ? tableWidth : 0)
            .attr('height', (d) => d.type === 'table' ? 20 : 0)
            .attr('fill', (d) => d.type === 'table' ? '#f0f0f0' : '#ffffff')
            .attr('rx', 2)
            .attr('stroke', '#dddddd')
            .attr('stroke-width', 1)
            .style('cursor', (d) => d.type === 'table' ? 'pointer' : 'default')
            .on('click', (event, d: Node) => handleTableClick(d));

        nodeGroups
            .append('text')
            .attr('x', 10)
            .attr('y', (d) => d.type === 'table' ? 30 : 20)
            .text((d) => d.name)
            .style('font-size', '7px');

        // Draw edges
        const allEdges = [
            ...(showTableRelationships ? inferredEdges : []), // Include inferredEdges only if showTableRelationships is true
            ...graph.edges.filter(edge => {
                const sourceNode = graph.nodes.find(n => n.id === edge.source);
                const targetNode = graph.nodes.find(n => n.id === edge.target);
                return sourceNode?.type === 'field' && targetNode?.type === 'field' &&
                       expandedTables.includes(sourceNode.tableId || '') &&
                       expandedTables.includes(targetNode.tableId || '');
            })
        ];
        

        container
            .selectAll('path.edge')
            .data(allEdges, (d: any) => d.id)
            .join('path')
            .attr('class', 'edge')
            .attr('fill', 'none')
            .attr('stroke', (d) => d.type === 'table-table' ? '#dddddd' : '#bbbbbb')
            .attr('stroke-width', (d) => d.type === 'table-table' ? 2 : 1)
            .attr('stroke-dasharray', (d) => d.type === 'table-table' ? '5,5' : 'none')
            .attr('d', (d) => {
                const sourceNode = d.type === 'table-table' 
                    ? tableNodes.find(n => n.id === d.source)
                    : visibleNodes.find(n => n.id === d.source);
                const targetNode = d.type === 'table-table'
                    ? tableNodes.find(n => n.id === d.target)
                    : visibleNodes.find(n => n.id === d.target);
                
                if (!sourceNode || !targetNode) return '';

                const sourceX = (sourceNode.x || 0) + tableWidth;
                const sourceY = (sourceNode.y || 0) + (sourceNode.type === 'table' ? tableHeight/2 : (fieldHeight/2) + 6);
                const targetX = targetNode.x || 0;
                const targetY = (targetNode.y || 0) + (targetNode.type === 'table' ? tableHeight/2 : (fieldHeight/2) + 6);

                const midX = (sourceX + targetX) / 2;
                
                return `M ${sourceX},${sourceY}
                        C ${midX},${sourceY}
                          ${midX},${targetY}
                          ${targetX},${targetY}`;
            });
    }, [graph, expandedTables, handleTableClick, showTableRelationships]);

    return (
        <div id="LineageMap">
            <h3 id="title">{title}</h3>
            <div style={{position: "absolute", left: "40px"}}>
                <label className="inline-flex items-center cursor-pointer">
                <input onChange={(e) => setShowTableRelationships(c => !c)} type="checkbox" value="" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show Table Level Relationships</span>
                </label>
            </div>

            <svg ref={svgRef} width="100%" height="100vh" />
        </div>
    );
};

export default LineageMap;
