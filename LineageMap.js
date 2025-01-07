class LineageMap {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || '100%',
            height: options.height || '100%',
            tableWidth: options.tableWidth || 150,
            tableHeight: options.tableHeight || 40,
            fieldHeight: options.fieldHeight || 20,
            fieldSpacing: options.fieldSpacing || 4,
            levelPadding: options.levelPadding || 100,
            verticalPadding: options.verticalPadding || 50
        };

        this.expandedTables = new Set();
        this.highlightedFields = new Set();
        this.showTableRelationships = false;

        this.init();
    }

    init() {
        // Create SVG container
        this.svg = d3.select(this.container)
            .append('svg')
            .style('width', this.options.width)
            .style('height', this.options.height);

        this.mainGroup = this.svg.append('g');

        // Setup zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 22])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom)
            .on('dblclick.zoom', null);
    }

    renderTable(node, data) {
        const { tableWidth, tableHeight } = this.options;

        // Add table background
        node.append('rect')
            .attr('width', tableWidth)
            .attr('height', tableHeight)
            .attr('fill', '#ffffff')
            .attr('stroke', '#cccccc')
            .attr('rx', 4);

        // Add table header
        node.append('rect')
            .attr('class', 'table-header')
            .attr('width', tableWidth)
            .attr('height', tableHeight)
            .attr('fill', '#f5f5f5')
            .attr('stroke', '#cccccc')
            .attr('rx', 4);

        // Add table name
        node.append('text')
            .attr('x', 10)
            .attr('y', tableHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#333333')
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .text(data.name);

        // Add expansion indicator
        const isExpanded = this.expandedTables.has(data.id);
        node.append('text')
            .attr('x', tableWidth - 20)
            .attr('y', tableHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#666666')
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .text(isExpanded ? '−' : '+');
    }

    renderField(node, data) {
        const { tableWidth, fieldHeight } = this.options;

        // Add field background
        node.append('rect')
            .attr('class', 'field-row')
            .attr('width', tableWidth)
            .attr('height', fieldHeight)
            .attr('fill', this.highlightedFields.has(data.id) ? '#e3f2fd' : '#ffffff')
            .attr('stroke', '#eeeeee');

        // Add field name
        node.append('text')
            .attr('x', 10)
            .attr('y', fieldHeight / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#666666')
            .style('font-family', 'sans-serif')
            .style('font-size', '11px')
            .text(data.name);
    }

    inferTableRelationships(graph) {
        const tableRelations = new Set();
        const inferredEdges = [];

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
    }

    getTableLevels(graph) {
        const tableDependencies = new Map();
        const tableNodes = graph.nodes.filter(node => node.type === 'table');

        tableNodes.forEach(table => {
            tableDependencies.set(table.id, new Set());
        });

        const inferredEdges = this.inferTableRelationships(graph);
        inferredEdges.forEach(edge => {
            const dependencySet = tableDependencies.get(edge.target);
            if (dependencySet) {
                dependencySet.add(edge.source);
            }
        });

        const levels = [];
        const processed = new Set();
        let currentLevel = 0;

        while (processed.size < tableNodes.length) {
            const currentLevelTables = Array.from(tableDependencies.entries())
                .filter(([tableId, deps]) =>
                    !processed.has(tableId) &&
                    Array.from(deps).every(dep => processed.has(dep))
                );

            if (currentLevelTables.length === 0 && processed.size < tableNodes.length) {
                tableNodes
                    .filter(table => !processed.has(table.id))
                    .forEach(table => {
                        levels.push({
                            id: table.id,
                            level: currentLevel,
                            dependencies: Array.from(tableDependencies.get(table.id) || [])
                        });
                        processed.add(table.id);
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
    }

    getRelatedFields(graph, fieldId) {
        const related = new Set([fieldId]);
        const visited = new Set();

        const traverse = (id) => {
            if (visited.has(id)) return;
            visited.add(id);

            graph.edges.forEach(edge => {
                if (edge.source === id) {
                    related.add(edge.target);
                    traverse(edge.target);
                }
                if (edge.target === id) {
                    related.add(edge.source);
                    traverse(edge.source);
                }
            });
        };

        traverse(fieldId);
        return related;
    }

    toggleTableExpansion(tableId) {
        if (this.expandedTables.has(tableId)) {
            this.expandedTables.delete(tableId);
        } else {
            this.expandedTables.add(tableId);
        }
        this.render(this.currentGraph);
    }

    handleFieldHover(graph, fieldId) {
        if (fieldId) {
            this.highlightedFields = this.getRelatedFields(graph, fieldId);
        } else {
            this.highlightedFields.clear();
        }
        this.renderHighlights();
    }
    
    renderHighlights() {
        // Update field backgrounds
        this.mainGroup.selectAll('.field-row')
            .style('fill', d => 
                this.highlightedFields.has(d.id) ? '#e3f2fd' : '#ffffff'
            );
    
        // Update edges
        this.mainGroup.selectAll('.edge')
            .attr('stroke', function(d) {
                const source = this.getAttribute('data-source');
                const target = this.getAttribute('data-target');
                if (source && target) {
                    const isHighlighted = this.ownerDocument.defaultView.lineageMap.highlightedFields.has(source) && 
                                        this.ownerDocument.defaultView.lineageMap.highlightedFields.has(target);
                    return isHighlighted ? '#2196f3' : '#bbbbbb';
                }
                return '#bbbbbb';
            })
            .attr('stroke-width', function(d) {
                const source = this.getAttribute('data-source');
                const target = this.getAttribute('data-target');
                if (source && target) {
                    const isHighlighted = this.ownerDocument.defaultView.lineageMap.highlightedFields.has(source) && 
                                        this.ownerDocument.defaultView.lineageMap.highlightedFields.has(target);
                    return isHighlighted ? 2 : 1;
                }
                return 1;
            });
    }

    renderBase(graph) {
        this.currentGraph = graph;
        
        // Auto-expand tables that have connections
        const connectedTables = new Set();
        graph.edges.forEach(edge => {
            const sourceNode = graph.nodes.find(n => n.id === edge.source);
            const targetNode = graph.nodes.find(n => n.id === edge.target);
            if (sourceNode && targetNode) {
                connectedTables.add(sourceNode.tableId);
                connectedTables.add(targetNode.tableId);
            }
        });
        connectedTables.forEach(tableId => {
            this.expandedTables.add(tableId);
        });
    
        const tableLevels = this.getTableLevels(graph);
        const positions = this.calculatePositions(graph, tableLevels);
        this.mainGroup.selectAll('*').remove();
        this.renderNodes(graph, positions);
        this.setupEventListeners();
    }
    
    render(graph) {
        this.currentGraph = graph;
        const tableLevels = this.getTableLevels(graph);
        const positions = this.calculatePositions(graph, tableLevels);
        this.mainGroup.selectAll('*').remove();
        this.renderEdges(graph, positions);
        this.renderNodes(graph, positions);
        this.setupEventListeners();
    }

    calculatePositions(graph, tableLevels) {
        const positions = new Map();
        const {
            tableWidth,
            tableHeight,
            fieldHeight,
            fieldSpacing,
            levelPadding,
            verticalPadding
        } = this.options;

        // Group tables by level
        const tablesByLevel = new Map();
        tableLevels.forEach(tableLevel => {
            if (!tablesByLevel.has(tableLevel.level)) {
                tablesByLevel.set(tableLevel.level, []);
            }
            tablesByLevel.get(tableLevel.level).push(tableLevel.id);
        });

        // Calculate table heights (including expanded fields)
        const getTableHeight = (tableId) => {
            if (!this.expandedTables.has(tableId)) {
                return tableHeight;
            }
            const fieldCount = graph.nodes.filter(n => n.tableId === tableId).length;
            return tableHeight + (fieldCount * (fieldHeight + fieldSpacing));
        };

        // Calculate total height needed for each level
        const levelHeights = new Map();
        tablesByLevel.forEach((tablesInLevel, level) => {
            const totalHeight = tablesInLevel.reduce((acc, tableId) => {
                return acc + getTableHeight(tableId) + verticalPadding;
            }, 0);
            levelHeights.set(level, totalHeight);
        });

        // Find maximum level height for vertical centering
        const maxLevelHeight = Math.max(...Array.from(levelHeights.values()));

        // Position tables and their fields
        tablesByLevel.forEach((tablesInLevel, level) => {
            const levelX = level * (tableWidth + levelPadding);
            const levelHeight = levelHeights.get(level) || 0;
            let currentY = (maxLevelHeight - levelHeight) / 2;

            tablesInLevel.forEach(tableId => {
                const tableNode = graph.nodes.find(n => n.id === tableId);
                if (!tableNode) return;

                // Position table
                positions.set(tableId, {
                    x: levelX,
                    y: currentY + verticalPadding
                });

                // Position fields if table is expanded
                if (this.expandedTables.has(tableId)) {
                    const fields = graph.nodes.filter(n => n.tableId === tableId);
                    fields.forEach((field, index) => {
                        positions.set(field.id, {
                            x: levelX,
                            y: currentY + verticalPadding + tableHeight + (index * (fieldHeight + fieldSpacing))
                        });
                    });
                }

                // Update Y position for next table
                currentY += getTableHeight(tableId) + verticalPadding;
            });
        });

        // Add positions for any remaining nodes (if any)
        graph.nodes.forEach(node => {
            if (!positions.has(node.id)) {
                // Set default position for any nodes not yet positioned
                positions.set(node.id, { x: 0, y: 0 });
            }
        });

        console.log(positions)
        return positions;
    }

    renderEdges(graph, positions) {
        const edges = this.showTableRelationships ?
            [...this.inferTableRelationships(graph), ...graph.edges] :
            graph.edges;
    
        // Group edges by source and target tables
        const edgesByTables = new Map();
        edges.forEach(edge => {
            if (edge.type === 'table-table') return;
    
            const sourceNode = graph.nodes.find(n => n.id === edge.source);
            const targetNode = graph.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return;
    
            // Only process edges where both tables are expanded
            if (!this.expandedTables.has(sourceNode.tableId) || 
                !this.expandedTables.has(targetNode.tableId)) return;
    
            const tableKey = `${sourceNode.tableId}-${targetNode.tableId}`;
            if (!edgesByTables.has(tableKey)) {
                edgesByTables.set(tableKey, []);
            }
            edgesByTables.get(tableKey).push(edge);
        });
    
        // Calculate control points for each table pair
        edgesByTables.forEach((tableEdges, tableKey) => {
            const [sourceTableId, targetTableId] = tableKey.split('-');
            const sourceTablePos = positions.get(sourceTableId);
            const targetTablePos = positions.get(targetTableId);
    
            if (!sourceTablePos || !targetTablePos) return;
    
            // Calculate horizontal distance between tables
            const horizontalDistance = targetTablePos.x - sourceTablePos.x;
            
            // Draw edges
            tableEdges.forEach(edge => {
                const sourcePos = positions.get(edge.source);
                const targetPos = positions.get(edge.target);
    
                if (!sourcePos || !targetPos) return;
    
                this.mainGroup.append('path')
                    .attr('class', 'edge')
                    .attr('data-source', edge.source)
                    .attr('data-target', edge.target)
                    .attr('d', () => {
                        const start = [sourcePos.x + this.options.tableWidth, sourcePos.y + this.options.fieldHeight / 2];
                        const end = [targetPos.x, targetPos.y + this.options.fieldHeight / 2];
                        
                        // Use fixed control point distances based on horizontal distance
                        const curveOffset = horizontalDistance / 3;
                        const ctrl1 = [start[0] + curveOffset, start[1]];
                        const ctrl2 = [end[0] - curveOffset, end[1]];
    
                        return `M ${start[0]},${start[1]} 
                                C ${ctrl1[0]},${ctrl1[1]} 
                                  ${ctrl2[0]},${ctrl2[1]} 
                                  ${end[0]},${end[1]}`;
                    })
                    .attr('stroke', '#bbbbbb')
                    .attr('stroke-width', 1)
                    .attr('fill', 'none');
            });
        });
    }

    renderNodes(graph, positions) {
        // Create node groups
        const nodes = this.mainGroup
            .selectAll('.node')
            .data(graph.nodes)
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => {
                const pos = positions.get(d.id);
                return pos ? `translate(${pos.x},${pos.y})` : '';
            });

        // Render tables
        nodes.filter(d => d.type === 'table')
            .each((d, i, nodes) => {
                const node = d3.select(nodes[i]);
                this.renderTable(node, d);
            });

        // Render fields for expanded tables
        nodes.filter(d => d.type === 'field' && this.expandedTables.has(d.tableId))
            .each((d, i, nodes) => {
                const node = d3.select(nodes[i]);
                this.renderField(node, d);
            });
    }

    setupEventListeners() {
        this.mainGroup.selectAll('.table-header')
            .on('click', (event, d) => this.toggleTableExpansion(d.id));

        this.mainGroup.selectAll('.field-row')
            .on('mouseenter', (event, d) => this.handleFieldHover(this.currentGraph, d.id))
            .on('mouseleave', () => this.handleFieldHover(this.currentGraph, null));
    }
}

export { LineageMap };