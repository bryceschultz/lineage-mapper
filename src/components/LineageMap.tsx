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

        const container = svg.append('g');

        const tableLevels = getTableLevels(graph);
        const inferredEdges = inferTableRelationships(graph);
        
        const tableWidth = 200;
        const tableHeight = 50;
        const fieldHeight = 30;
        const fieldSpacing = 10;
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
        const totalHeight = (maxTablesInLevel * tableHeight) + ((maxTablesInLevel - 1) * verticalPadding);
        
        // Position tables level by level with even vertical distribution
        tablesByLevel.forEach((tablesInLevel, level) => {
            const startX = level * (tableWidth + levelPadding * 2);
            const spacing = totalHeight / (tablesInLevel.length + 1);
            
            tablesInLevel.forEach((tableId, index) => {
                const node = tableNodes.find(n => n.id === tableId);
                if (node) {
                    node.x = startX;
                    node.y = spacing * (index + 1) - tableHeight / 2;

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

        let currentY = verticalPadding;
        tablesByLevel.forEach((tablesInLevel, level) => {
            let levelHeight = 0;
            const startX = level * (tableWidth + levelPadding * 2);

            tablesInLevel.forEach((tableId, index) => {
                const node = tableNodes.find(n => n.id === tableId);
                if (node) {
                    node.x = startX;
                    node.y = currentY;

                    // Update levelHeight if this table is taller
                    const tableFullHeight = getTableFullHeight(tableId);
                    levelHeight = Math.max(levelHeight, tableFullHeight);

                    // Position the table's fields if it's expanded
                    if (expandedTables.includes(tableId)) {
                        const tableFields = fieldNodes.filter(field => field.tableId === tableId);
                        tableFields.forEach((field, fieldIndex) => {
                            field.x = node.x;
                            field.y = node.y + tableHeight + fieldSpacing + 
                                    (fieldIndex * (fieldHeight + fieldSpacing));
                        });
                    }

                    // Add vertical padding for the next table in this level
                    if (index < tablesInLevel.length - 1) {
                        currentY += levelHeight + verticalPadding * 2;
                        levelHeight = 0;
                    }
                }
            });

            // Move to the next level
            currentY += levelHeight + verticalPadding * 2;
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
            .attr('width', (d) => d.type === 'table' ? tableWidth : 150)
            .attr('height', (d) => d.type === 'table' ? tableHeight : fieldHeight)
            .attr('fill', (d) => d.type === 'table' ? '#f0f0f0' : '#ffffff')
            .attr('rx', 10)
            .attr('stroke', '#dddddd')
            .attr('stroke-width', 1)
            .style('cursor', (d) => d.type === 'table' ? 'pointer' : 'default')
            .on('click', (event, d: Node) => handleTableClick(d));

        nodeGroups
            .append('text')
            .attr('x', 10)
            .attr('y', (d) => d.type === 'table' ? 30 : 20)
            .text((d) => d.name)
            .style('font-size', '14px');

        // Draw edges
        const allEdges = [
            ...inferredEdges,
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

                const sourceX = (sourceNode.x || 0) + (sourceNode.type === 'table' ? tableWidth : 150);
                const sourceY = (sourceNode.y || 0) + (sourceNode.type === 'table' ? tableHeight/2 : fieldHeight/2);
                const targetX = targetNode.x || 0;
                const targetY = (targetNode.y || 0) + (targetNode.type === 'table' ? tableHeight/2 : fieldHeight/2);

                const midX = (sourceX + targetX) / 2;
                
                return `M ${sourceX},${sourceY}
                        C ${midX},${sourceY}
                          ${midX},${targetY}
                          ${targetX},${targetY}`;
            });

    }, [graph, expandedTables, handleTableClick]);

    return (
        <div id="LineageMap">
            <h3 id="title">{title}</h3>
            <svg ref={svgRef} width="100%" height="100vh" />
        </div>
    );
}

export default LineageMap;