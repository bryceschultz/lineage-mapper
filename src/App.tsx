import './App.css'
import LineageMap from './components/LineageMap'
import { Graph } from './types/GraphTypes';

const App = () => {
  const graph: Graph = {
    nodes: [
      // Table 1
      { id: 'table1', type: 'table', name: 'Table 1' },
      // Table 1 Fields
      { id: 'field1', type: 'field', name: 'Field 1', tableId: 'table1' },
      { id: 'field2', type: 'field', name: 'Field 2', tableId: 'table1' },
      { id: 'field4', type: 'field', name: 'Field 4', tableId: 'table1' },
      { id: 'field5', type: 'field', name: 'Field 5', tableId: 'table1' },

      // Table 2
      { id: 'table2', type: 'table', name: 'Table 2' },
      // Table 2 Fields
      { id: 'field3', type: 'field', name: 'Field 3', tableId: 'table2' },

      // Table 3
      { id: 'table3', type: 'table', name: 'Table 3' },
      // Table 3 Fields
      { id: 'field6', type: 'field', name: 'Field 6', tableId: 'table3' },
      { id: 'field7', type: 'field', name: 'Field 7', tableId: 'table3' },
      
      // Table 4
      { id: 'table4', type: 'table', name: 'Table 4' },
      // Table 4 Fields
      { id: 'field8', type: 'field', name: 'Field 8', tableId: 'table4' },

    ],
    edges: [
      { id: 'edge1', source: 'table1', target: 'table2', type: 'table-table' },
      { id: 'edge7', source: 'table4', target: 'table2', type: 'table-table' },
      { id: 'edge2', source: 'field1', target: 'field3', type: 'field-field' },
      { id: 'edge3', source: 'field5', target: 'field3', type: 'field-field' },
      { id: 'edge4', source: 'field4', target: 'field3', type: 'field-field' },
      { id: 'edge5', source: 'field6', target: 'field3', type: 'field-field' },
      { id: 'edge6', source: 'field8', target: 'field3', type: 'field-field' },
    ],
  };

  return (
    <LineageMap
      title={"Data Transformation for Process XYZ"}
      graph={graph}
    />
  )
}

export default App