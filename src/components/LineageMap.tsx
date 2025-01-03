import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Graph, Node } from '../types/GraphTypes';

interface LineageMapProps {
    title: string;
    graph: Graph;
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

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const container = svg.append('g');

        // Calculate node positions
        const tableNodes = graph.nodes.filter((node) => node.type === 'table');
        const fieldNodes = graph.nodes.filter((node) => node.type === 'field');

        const tableWidth = 200;
        const tableHeight = 50;
        const fieldHeight = 30;
        const fieldSpacing = 10;
        const padding = 50;

        const numTables = tableNodes.length;
        const numCols = Math.ceil(Math.sqrt(numTables));
        const numRows = Math.ceil(numTables / numCols);

        const colWidth = tableWidth + padding;
        const rowHeight = tableHeight + padding * 3;

        // Position tables in a grid
        tableNodes.forEach((node, index) => {
            const colIndex = index % numCols;
            const rowIndex = Math.floor(index / numCols);
            node.x = colIndex * colWidth + padding;
            node.y = rowIndex * rowHeight + padding;
        });

        // Position fields relative to their parent tables
        tableNodes.forEach(table => {
            const tableFields = fieldNodes.filter(field => field.tableId === table.id);
            
            tableFields.forEach((field, fieldIndex) => {
                if (table.x !== undefined && table.y !== undefined) {
                    field.x = table.x;
                    field.y = table.y + tableHeight + fieldSpacing + 
                             (fieldIndex * (fieldHeight + fieldSpacing));
                }
            });
        });

        // Filter visible nodes
        const visibleNodes = graph.nodes.filter((node) => {
            if (node.type === 'table') return true;
            return node.type === 'field' && node.tableId && expandedTables.includes(node.tableId);
        });

        // Create node groups
        const nodeGroups = container
            .selectAll('g.node')
            .data(visibleNodes, (d: any) => d.id)
            .join('g')
            .attr('class', 'node')
            .attr('transform', (d) => `translate(${d.x},${d.y})`);

        // Add rectangles to nodes
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

        // Add text labels to nodes
        nodeGroups
            .append('text')
            .attr('x', 10)
            .attr('y', (d) => d.type === 'table' ? 30 : 20)
            .text((d) => d.name)
            .style('font-size', '14px');

        // Filter visible edges
        const visibleEdges = graph.edges.filter(edge => {
            const sourceNode = graph.nodes.find(n => n.id === edge.source);
            const targetNode = graph.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return false;
            
            if (sourceNode.type === 'field' && !expandedTables.includes(sourceNode.tableId || '')) return false;
            if (targetNode.type === 'field' && !expandedTables.includes(targetNode.tableId || '')) return false;
            
            return true;
        });

        container
            .selectAll('path.edge')
            .data(visibleEdges, (d: any) => d.id)
            .join('path')
            .attr('class', 'edge')
            .attr('fill', 'none')
            .attr('stroke', '#dddddd')
            .attr('stroke-width', 1)
            .attr('d', (d) => {
                const sourceNode = visibleNodes.find(n => n.id === d.source);
                const targetNode = visibleNodes.find(n => n.id === d.target);
                
                if (!sourceNode || !targetNode) return '';

                const sourceX = (sourceNode.x || 0) + (sourceNode.type === 'table' ? tableWidth : 150);
                const sourceY = (sourceNode.y || 0) + (sourceNode.type === 'table' ? tableHeight/2 : fieldHeight/2);
                const targetX = targetNode.x || 0;
                const targetY = (targetNode.y || 0) + (targetNode.type === 'table' ? tableHeight/2 : fieldHeight/2);

                // Calculate control points for the S-curve
                const midX = (sourceX + targetX) / 2;
                
                // Create the S-curve path
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