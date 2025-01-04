import './App.css'
import LineageMap from './components/LineageMap'
import { Graph } from './types/GraphTypes';

const App = () => {
  const graph: Graph = {
    nodes: [
      // Table A
      { id: 'tableA', type: 'table', name: 'Table A' },
      // Table A Fields
      { id: 'fieldA1', type: 'field', name: 'Field A1', tableId: 'tableA' },
      { id: 'fieldA2', type: 'field', name: 'Field A2', tableId: 'tableA' },
      { id: 'fieldA3', type: 'field', name: 'Field A3', tableId: 'tableA' },
      { id: 'fieldA4', type: 'field', name: 'Field A4', tableId: 'tableA' },
      { id: 'fieldA5', type: 'field', name: 'Field A5', tableId: 'tableA' },
      { id: 'fieldA6', type: 'field', name: 'Field A6', tableId: 'tableA' },
      { id: 'fieldA7', type: 'field', name: 'Field A7', tableId: 'tableA' },
      { id: 'fieldA8', type: 'field', name: 'Field A8', tableId: 'tableA' },
      { id: 'fieldA9', type: 'field', name: 'Field A9', tableId: 'tableA' },
      { id: 'fieldA10', type: 'field', name: 'Field A10', tableId: 'tableA' },
      { id: 'fieldA11', type: 'field', name: 'Field A11', tableId: 'tableA' },
      { id: 'fieldA12', type: 'field', name: 'Field A12', tableId: 'tableA' },
      { id: 'fieldA13', type: 'field', name: 'Field A13', tableId: 'tableA' },
      { id: 'fieldA14', type: 'field', name: 'Field A14', tableId: 'tableA' },
      { id: 'fieldA15', type: 'field', name: 'Field A15', tableId: 'tableA' },
      { id: 'fieldA16', type: 'field', name: 'Field A16', tableId: 'tableA' },
      { id: 'fieldA17', type: 'field', name: 'Field A17', tableId: 'tableA' },
      { id: 'fieldA18', type: 'field', name: 'Field A18', tableId: 'tableA' },
      { id: 'fieldA19', type: 'field', name: 'Field A19', tableId: 'tableA' },
      { id: 'fieldA20', type: 'field', name: 'Field A20', tableId: 'tableA' },
      { id: 'fieldA21', type: 'field', name: 'Field A21', tableId: 'tableA' },
      { id: 'fieldA22', type: 'field', name: 'Field A22', tableId: 'tableA' },
      { id: 'fieldA23', type: 'field', name: 'Field A23', tableId: 'tableA' },
      { id: 'fieldA24', type: 'field', name: 'Field A24', tableId: 'tableA' },
      { id: 'fieldA25', type: 'field', name: 'Field A25', tableId: 'tableA' },
      { id: 'fieldA26', type: 'field', name: 'Field A26', tableId: 'tableA' },
      { id: 'fieldA27', type: 'field', name: 'Field A27', tableId: 'tableA' },
      { id: 'fieldA28', type: 'field', name: 'Field A28', tableId: 'tableA' },
      { id: 'fieldA29', type: 'field', name: 'Field A29', tableId: 'tableA' },
      { id: 'fieldA30', type: 'field', name: 'Field A30', tableId: 'tableA' },
      { id: 'fieldA31', type: 'field', name: 'Field A31', tableId: 'tableA' },
      { id: 'fieldA32', type: 'field', name: 'Field A32', tableId: 'tableA' },
      { id: 'fieldA33', type: 'field', name: 'Field A33', tableId: 'tableA' },
      { id: 'fieldA34', type: 'field', name: 'Field A34', tableId: 'tableA' },
      { id: 'fieldA35', type: 'field', name: 'Field A35', tableId: 'tableA' },
      { id: 'fieldA36', type: 'field', name: 'Field A36', tableId: 'tableA' },
      { id: 'fieldA37', type: 'field', name: 'Field A37', tableId: 'tableA' },
      { id: 'fieldA38', type: 'field', name: 'Field A38', tableId: 'tableA' },
      { id: 'fieldA39', type: 'field', name: 'Field A39', tableId: 'tableA' },
      { id: 'fieldA40', type: 'field', name: 'Field A40', tableId: 'tableA' },
      { id: 'fieldA41', type: 'field', name: 'Field A41', tableId: 'tableA' },
      { id: 'fieldA42', type: 'field', name: 'Field A42', tableId: 'tableA' },
      { id: 'fieldA43', type: 'field', name: 'Field A43', tableId: 'tableA' },
      { id: 'fieldA44', type: 'field', name: 'Field A44', tableId: 'tableA' },
      { id: 'fieldA45', type: 'field', name: 'Field A45', tableId: 'tableA' },
      { id: 'fieldA46', type: 'field', name: 'Field A46', tableId: 'tableA' },
      { id: 'fieldA47', type: 'field', name: 'Field A47', tableId: 'tableA' },
      { id: 'fieldA48', type: 'field', name: 'Field A48', tableId: 'tableA' },
      { id: 'fieldA49', type: 'field', name: 'Field A49', tableId: 'tableA' },
      { id: 'fieldA50', type: 'field', name: 'Field A50', tableId: 'tableA' },
      

      // Table B
      { id: 'tableB', type: 'table', name: 'Table B' },
      // Table B Fields
      { id: 'fieldB1', type: 'field', name: 'Field B1', tableId: 'tableB' },

      // Table C
      { id: 'tableC', type: 'table', name: 'Table C' },
      // Table C Fields
      { id: 'fieldC1', type: 'field', name: 'Field C1', tableId: 'tableC' },

      // Table D
      { id: 'tableD', type: 'table', name: 'Table D' },
      // Table D Fields
      { id: 'fieldD1', type: 'field', name: 'Field D1', tableId: 'tableD' },
      { id: 'fieldD2', type: 'field', name: 'Field D2', tableId: 'tableD' },
      { id: 'fieldD3', type: 'field', name: 'Field D3', tableId: 'tableD' },
      { id: 'fieldD4', type: 'field', name: 'Field D4', tableId: 'tableD' },
      { id: 'fieldD5', type: 'field', name: 'Field D5', tableId: 'tableD' },
      { id: 'fieldD6', type: 'field', name: 'Field D6', tableId: 'tableD' },
      { id: 'fieldD7', type: 'field', name: 'Field D7', tableId: 'tableD' },
      { id: 'fieldD8', type: 'field', name: 'Field D8', tableId: 'tableD' },
      { id: 'fieldD9', type: 'field', name: 'Field D9', tableId: 'tableD' },
      { id: 'fieldD10', type: 'field', name: 'Field D10', tableId: 'tableD' },
      { id: 'fieldD11', type: 'field', name: 'Field D11', tableId: 'tableD' },
      { id: 'fieldD12', type: 'field', name: 'Field D12', tableId: 'tableD' },
      { id: 'fieldD13', type: 'field', name: 'Field D13', tableId: 'tableD' },
      { id: 'fieldD14', type: 'field', name: 'Field D14', tableId: 'tableD' },
      { id: 'fieldD15', type: 'field', name: 'Field D15', tableId: 'tableD' },
      { id: 'fieldD16', type: 'field', name: 'Field D16', tableId: 'tableD' },
      { id: 'fieldD17', type: 'field', name: 'Field D17', tableId: 'tableD' },
      { id: 'fieldD18', type: 'field', name: 'Field D18', tableId: 'tableD' },
      { id: 'fieldD19', type: 'field', name: 'Field D19', tableId: 'tableD' },
      { id: 'fieldD20', type: 'field', name: 'Field D20', tableId: 'tableD' },
      { id: 'fieldD21', type: 'field', name: 'Field D21', tableId: 'tableD' },
      { id: 'fieldD22', type: 'field', name: 'Field D22', tableId: 'tableD' },
      { id: 'fieldD23', type: 'field', name: 'Field D23', tableId: 'tableD' },
      { id: 'fieldD24', type: 'field', name: 'Field D24', tableId: 'tableD' },
      { id: 'fieldD25', type: 'field', name: 'Field D25', tableId: 'tableD' },
      { id: 'fieldD26', type: 'field', name: 'Field D26', tableId: 'tableD' },
      { id: 'fieldD27', type: 'field', name: 'Field D27', tableId: 'tableD' },
      { id: 'fieldD28', type: 'field', name: 'Field D28', tableId: 'tableD' },
      { id: 'fieldD29', type: 'field', name: 'Field D29', tableId: 'tableD' },
      { id: 'fieldD30', type: 'field', name: 'Field D30', tableId: 'tableD' },
      { id: 'fieldD31', type: 'field', name: 'Field D31', tableId: 'tableD' },
      { id: 'fieldD32', type: 'field', name: 'Field D32', tableId: 'tableD' },
      { id: 'fieldD33', type: 'field', name: 'Field D33', tableId: 'tableD' },
      { id: 'fieldD34', type: 'field', name: 'Field D34', tableId: 'tableD' },
      { id: 'fieldD35', type: 'field', name: 'Field D35', tableId: 'tableD' },
      { id: 'fieldD36', type: 'field', name: 'Field D36', tableId: 'tableD' },
      { id: 'fieldD37', type: 'field', name: 'Field D37', tableId: 'tableD' },
      { id: 'fieldD38', type: 'field', name: 'Field D38', tableId: 'tableD' },
      { id: 'fieldD39', type: 'field', name: 'Field D39', tableId: 'tableD' },
      { id: 'fieldD40', type: 'field', name: 'Field D40', tableId: 'tableD' },
      { id: 'fieldD41', type: 'field', name: 'Field D41', tableId: 'tableD' },
      { id: 'fieldD42', type: 'field', name: 'Field D42', tableId: 'tableD' },
      { id: 'fieldD43', type: 'field', name: 'Field D43', tableId: 'tableD' },
      { id: 'fieldD44', type: 'field', name: 'Field D44', tableId: 'tableD' },
      { id: 'fieldD45', type: 'field', name: 'Field D45', tableId: 'tableD' },
      { id: 'fieldD46', type: 'field', name: 'Field D46', tableId: 'tableD' },
      { id: 'fieldD47', type: 'field', name: 'Field D47', tableId: 'tableD' },
      { id: 'fieldD48', type: 'field', name: 'Field D48', tableId: 'tableD' },
      { id: 'fieldD49', type: 'field', name: 'Field D49', tableId: 'tableD' },
      { id: 'fieldD50', type: 'field', name: 'Field D50', tableId: 'tableD' },
      { id: 'fieldD51', type: 'field', name: 'Field D51', tableId: 'tableD' },
      { id: 'fieldD52', type: 'field', name: 'Field D52', tableId: 'tableD' },
      { id: 'fieldD53', type: 'field', name: 'Field D53', tableId: 'tableD' },
      { id: 'fieldD54', type: 'field', name: 'Field D54', tableId: 'tableD' },
      { id: 'fieldD55', type: 'field', name: 'Field D55', tableId: 'tableD' },
      { id: 'fieldD56', type: 'field', name: 'Field D56', tableId: 'tableD' },
      { id: 'fieldD57', type: 'field', name: 'Field D57', tableId: 'tableD' },
      { id: 'fieldD58', type: 'field', name: 'Field D58', tableId: 'tableD' },
      { id: 'fieldD59', type: 'field', name: 'Field D59', tableId: 'tableD' },
      { id: 'fieldD60', type: 'field', name: 'Field D60', tableId: 'tableD' },


      // Table E
      { id: 'tableE', type: 'table', name: 'Table E' },
      // Table E Fields
      { id: 'fieldE1', type: 'field', name: 'Field E1', tableId: 'tableE' },

      // Table F
      { id: 'tableF', type: 'table', name: 'Table F' },
      // Table F Fields
      { id: 'fieldF1', type: 'field', name: 'Field F1', tableId: 'tableF' },
    ],
    edges: [
      { id: 'edge1', source: 'fieldA1', target: 'fieldD7', type: 'field-field' },
      { id: 'edge2', source: 'fieldB1', target: 'fieldD8', type: 'field-field' },
      { id: 'edge3', source: 'fieldC1', target: 'fieldD1', type: 'field-field' },
      { id: 'edge4', source: 'fieldD1', target: 'fieldE1', type: 'field-field' },
      { id: 'edge5', source: 'fieldC1', target: 'fieldF1', type: 'field-field' },
      { id: 'edge6', source: 'fieldA7', target: 'fieldD1', type: 'field-field' },
      { id: 'edge6', source: 'fieldA8', target: 'fieldD2', type: 'field-field' },
    ]
  };

  return (
    <LineageMap
      title={"Data Transformation for Process XYZ"}
      graph={graph}
    />
  )
}

export default App