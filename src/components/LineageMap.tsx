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
    const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

    const handleTableClick = useCallback((tableId: string) => {
        setExpandedTables(prev => {
            const isExpanded = prev.includes(tableId);
            if (isExpanded) {
                return prev.filter(id => id !== tableId);
            } else {
                return [...prev, tableId];
            }
        });
    }, []);

    const getRelatedFields = (fieldId: string): string[] => {
        const related = new Set<string>([fieldId]);

        const findUpstream = (id: string) => {
            graph.edges.forEach(edge => {
                if (edge.target === id) {
                    related.add(edge.source);
                    findUpstream(edge.source);
                }
            });
        };

        const findDownstream = (id: string) => {
            graph.edges.forEach(edge => {
                if (edge.source === id) {
                    related.add(edge.target);
                    findDownstream(edge.target);
                }
            });
        };

        findUpstream(fieldId);
        findDownstream(fieldId);

        return Array.from(related);
    };

    const handleFieldHover = useCallback((fieldId: string | null) => {
        if (fieldId) {
            const relatedFields = getRelatedFields(fieldId);
            setHighlightedFields(new Set(relatedFields));
        } else {
            setHighlightedFields(new Set());
        }
    }, [graph.edges]);


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

        const tableWidth = 150;
        const tableHeight = 40;
        const fieldWidth = tableWidth - 20; // Add this constant definition
        const fieldHeight = 20;
        const fieldSpacing = 4;
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
            return tableHeight + (fields.length * (fieldHeight + fieldSpacing));
        };

        // Group tables by level
        const tablesByLevel = new Map<number, string[]>();
        tableLevels.forEach(tableLevel => {
            if (!tablesByLevel.has(tableLevel.level)) {
                tablesByLevel.set(tableLevel.level, []);
            }
            tablesByLevel.get(tableLevel.level)?.push(tableLevel.id);
        });

        // Calculate total height needed for each level
        const levelHeights = new Map<number, number>();
        tablesByLevel.forEach((tablesInLevel, level) => {
            const totalHeight = tablesInLevel.reduce((acc, tableId) => {
                return acc + getTableFullHeight(tableId) + verticalPadding;
            }, 0);
            levelHeights.set(level, totalHeight);
        });

        // Find the maximum level height
        const maxLevelHeight = Math.max(...Array.from(levelHeights.values()));

        // Position tables with proper vertical distribution
        tablesByLevel.forEach((tablesInLevel, level) => {
            const startX = level * (tableWidth + levelPadding);
            let currentY = verticalPadding;

            // Calculate the starting Y position to center the level vertically
            const levelHeight = levelHeights.get(level) || 0;
            const startY = (maxLevelHeight - levelHeight) / 2;
            currentY += startY;

            tablesInLevel.forEach((tableId) => {
                const node = tableNodes.find(n => n.id === tableId);
                if (node) {
                    // Position the table
                    node.x = startX;
                    node.y = currentY;

                    // Position the table's fields if it's expanded
                    if (expandedTables.includes(tableId)) {
                        const tableFields = fieldNodes.filter(field => field.tableId === tableId);
                        tableFields.forEach((field, fieldIndex) => {
                            field.x = node.x;
                            field.y = node.y + tableHeight +
                                (fieldIndex * (fieldHeight + fieldSpacing));
                        });
                    }

                    // Update currentY for the next table
                    currentY += getTableFullHeight(tableId) + verticalPadding;
                }
            });
        });


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
            .append('foreignObject')
            .attr('width', (d) => d.type === 'table' ? tableWidth : fieldWidth)
            .attr('height', (d) => {
                if (d.type === 'table' && expandedTables.includes(d.id)) {
                    const fields = graph.nodes.filter((n) => n.tableId === d.id);
                    return tableHeight + (fields.length * (fieldHeight + fieldSpacing)) + 20;
                }
                return d.type === 'table' ? tableHeight : fieldHeight;
            })
            .html((d) => {
                if (d.type === 'table') {
                    const fieldsHtml = graph.nodes
                        .filter((n) => n.tableId === d.id)
                        .map((field) => {
                            const isHighlighted = highlightedFields.has(field.id);
                            return `
                                <div 
                                    style="
                                        display: flex; 
                                        flex-direction: row; 
                                        align-items: center; 
                                        justify-content: space-between;
                                        background-color: ${isHighlighted ? '#1d9bf0' : 'transparent'};
                                        color: ${isHighlighted ? 'white' : 'inherit'};
                                        padding: 2px 5px;
                                        border-radius: 4px;
                                        transition: all 0.2s ease;
                                        margin: 2px 0;
                                    "
                                    class="field-row"
                                    data-field-id="${field.id}"
                                >
                                    <svg width="12" height="12" style="margin-right: 5px;">
                                        <rect x="2" y="2" width="8" height="8" fill="${isHighlighted ? 'white' : '#ccc'}" rx="2" />
                                    </svg>
                                    <span style="font-size: 12px; flex-grow: 1;">${field.name}</span>
                                </div>
                            `;
                        })
                        .join('');

                    return `
                        <div style="
                            width: ${tableWidth}px; 
                            background-color: #f0f0f0; 
                            border-radius: 4px;
                            border: 1px solid #dddddd; 
                            padding: 10px; 
                            display: flex; 
                            flex-direction: column;
                            gap: 4px;
                            min-height: ${tableHeight}px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 14px; font-weight: 500;">${d.name}</span>
                                <button 
                                    onclick="window.handleTableExpand('${d.id}')"
                                    class="expand-collapse-button" 
                                    style="
                                        padding: 4px 8px;
                                        background: white;
                                        border: 1px solid #ddd;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-family: monospace;
                                    "
                                >
                                    ${expandedTables.includes(d.id) ? '−' : '+'}
                                </button>
                            </div>
                            ${expandedTables.includes(d.id) ? `
                                <div style="margin-top: 8px;">
                                    ${fieldsHtml}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
                return '';
            });

        // Add global click handler
        window.handleTableExpand = (tableId: string) => {
            handleTableClick(tableId);
        };

        // Add field hover handlers
        nodeGroups.selectAll('.field-row')
            .on('mouseenter', function (this: HTMLElement) {
                const fieldId = this.getAttribute('data-field-id');
                if (fieldId) handleFieldHover(fieldId);
            })
            .on('mouseleave', () => handleFieldHover(null));

        // Draw edges with highlighting
        const allEdges = [
            ...(showTableRelationships ? inferTableRelationships(graph) : []),
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
            .attr('stroke', (d) => {
                if (d.type === 'table-table') return '#dddddd';
                return (highlightedFields.has(d.source) && highlightedFields.has(d.target))
                    ? '#1d9bf0'
                    : '#bbbbbb';
            })
            .attr('stroke-width', (d) => {
                if (d.type === 'table-table') return 2;
                return (highlightedFields.has(d.source) && highlightedFields.has(d.target))
                    ? 2
                    : 1;
            })
            .attr('stroke-dasharray', (d) => d.type === 'table-table' ? '5,5' : 'none')
            .attr('d', (d) => {
                const sourceNode = d.type === 'table-table'
                    ? graph.nodes.find(n => n.id === d.source)
                    : visibleNodes.find(n => n.id === d.source);
                const targetNode = d.type === 'table-table'
                    ? graph.nodes.find(n => n.id === d.target)
                    : visibleNodes.find(n => n.id === d.target);

                if (!sourceNode || !targetNode) return '';

                const sourceX = (sourceNode.x || 0) + tableWidth;
                const sourceY = (sourceNode.y || 0) + (sourceNode.type === 'table' ? tableHeight / 2 : fieldHeight / 2);
                const targetX = targetNode.x || 0;
                const targetY = (targetNode.y || 0) + (targetNode.type === 'table' ? tableHeight / 2 : fieldHeight / 2);

                const midX = (sourceX + targetX) / 2;

                return `M ${sourceX},${sourceY}
                        C ${midX},${sourceY}
                          ${midX},${targetY}
                          ${targetX},${targetY}`;
            });

    }, [graph, expandedTables, handleTableClick, showTableRelationships, highlightedFields]);

    return (
        <div className="relative w-full h-screen">
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="absolute left-4 top-4 z-10">
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showTableRelationships}
                        onChange={(e) => setShowTableRelationships(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    <span className="ml-3 text-sm font-medium">Show Table Relationships</span>
                </label>
            </div>
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
};

export default LineageMap;