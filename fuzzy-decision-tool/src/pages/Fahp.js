// Import necessary libraries and components
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Tree from 'react-d3-tree';
import { Container, Row, Col, Button, Form, Table } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Fahp.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FAHP = () => {
  const [projectName, setProjectName] = useState('');
  const [numCriteria, setNumCriteria] = useState(0);
  const [criteriaNames, setCriteriaNames] = useState([]);
  const [numSubCriteria, setNumSubCriteria] = useState([]);
  const [subCriteriaNames, setSubCriteriaNames] = useState([]);
  const [pairwiseMatrix, setPairwiseMatrix] = useState([]);
  const [subCriteriaMatrices, setSubCriteriaMatrices] = useState([]);
  const [crValues, setCrValues] = useState([]);
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTree, setShowTree] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleCriteriaChange = (e) => {
    setNumCriteria(parseInt(e.target.value, 10));
  };

  const handleSubCriteriaChange = (index, value) => {
    const newSubCriteria = [...numSubCriteria];
    newSubCriteria[index] = parseInt(value, 10);
    setNumSubCriteria(newSubCriteria);

    const newSubCriteriaNames = [...subCriteriaNames];
    newSubCriteriaNames[index] = Array.from({ length: value }, (_, subIndex) => `Sub-Criteria ${subIndex + 1}`);
    setSubCriteriaNames(newSubCriteriaNames);
  };

  const handleSubCriteriaNameChange = (criterionIndex, subIndex, value) => {
    const newSubCriteriaNames = [...subCriteriaNames];
    newSubCriteriaNames[criterionIndex][subIndex] = value;
    setSubCriteriaNames(newSubCriteriaNames);
  };

  const generateMatrix = () => {
    const size = numCriteria + numSubCriteria.reduce((acc, val) => acc + val, 0);
    const newMatrix = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => (i === j ? 1 : ''))
    );
    setPairwiseMatrix(newMatrix);
  };

  const handleChange = (e, rowIndex, colIndex) => {
    const newMatrix = [...pairwiseMatrix];
    newMatrix[rowIndex][colIndex] = parseFloat(e.target.value);
    newMatrix[colIndex][rowIndex] = parseFloat((1 / e.target.value).toFixed(3));
    setPairwiseMatrix(newMatrix);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('token');
      const response = await axios.post('http://127.0.0.1:5000/api/fuzzy-ahp', {
        pairwise_matrix: pairwiseMatrix
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWeights(response.data.weights);
      setSubCriteriaMatrices(response.data.sub_criteria_matrices || []);
      setCrValues(response.data.cr_values || []);
      setShowTree(true);

      // Save criteria and sub-criteria names along with the matrix to local storage
      const fahpData = {
        criteriaNames,
        subCriteriaNames,
        pairwiseMatrix
      };
      localStorage.setItem('fahp_data', JSON.stringify(fahpData));
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getTreeData = () => {
    const criteriaNodes = criteriaNames.map((criteria, index) => ({
      name: criteria,
      children: subCriteriaNames[index]?.map((subCriteria) => ({
        name: subCriteria,
      })),
    }));

    return {
      name: projectName || 'Project',
      children: criteriaNodes,
    };
  };

  const getChartData = () => {
    return {
      labels: criteriaNames,
      datasets: [
        {
          label: 'Criteria Weights',
          data: weights,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <Container>
      <h2 className="custom-title">FAHP (Fuzzy Analytic Hierarchy Process)</h2>
      <div className="container-etape">
        <Form.Group as={Row}>
          <Form.Label column sm="2">
            Project Name:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              value={projectName}
              onChange={handleProjectNameChange}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row}>
          <Form.Label column sm="2">
            Number of Criteria:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="number"
              value={numCriteria}
              onChange={handleCriteriaChange}
            />
          </Col>
        </Form.Group>
        <Button onClick={generateMatrix}>Generate Matrix</Button>
      </div>

      {numCriteria > 0 && (
        <div className="container-etape">
          {Array.from({ length: numCriteria }, (_, i) => (
            <Form.Group as={Row} key={i}>
              <Form.Label column sm="2">
                Criterion {i + 1} Name:
              </Form.Label>
              <Col sm="4">
                <Form.Control
                  type="text"
                  onChange={(e) => {
                    const newCriteriaNames = [...criteriaNames];
                    newCriteriaNames[i] = e.target.value;
                    setCriteriaNames(newCriteriaNames);
                  }}
                />
              </Col>
              <Form.Label column sm="2">
                Number of Sub-Criteria:
              </Form.Label>
              <Col sm="4">
                <Form.Control
                  type="number"
                  onChange={(e) => handleSubCriteriaChange(i, e.target.value)}
                />
              </Col>
              {numSubCriteria[i] > 0 && (
                <div className="sub-criteria">
                  {Array.from({ length: numSubCriteria[i] }, (_, subIndex) => (
                    <Form.Group as={Row} key={subIndex}>
                      <Form.Label column sm="4">
                        Sub-Criteria {subIndex + 1} Name:
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          type="text"
                          value={subCriteriaNames[i]?.[subIndex] || ''}
                          onChange={(e) => handleSubCriteriaNameChange(i, subIndex, e.target.value)}
                        />
                      </Col>
                    </Form.Group>
                  ))}
                </div>
              )}
            </Form.Group>
          ))}
        </div>
      )}

      {pairwiseMatrix.length > 0 && (
        <div className="container-etape">
          <h3 className="custom-subtitle">Enter Pairwise Matrix:</h3>
          <Table bordered responsive>
            <tbody>
              {pairwiseMatrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, colIndex) => (
                    <td key={colIndex}>
                      <Form.Control
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(e, rowIndex, colIndex)}
                        disabled={rowIndex === colIndex || colIndex < rowIndex}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Weights'}
          </Button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {weights && (
        <div className="container-etape">
          <h3 className="custom-subtitle">Weights:</h3>
          <ul>
            {weights.map((weight, index) => (
              <li key={index}>{weight}</li>
            ))}
          </ul>
        </div>
      )}

      {showTree && (
        <div className="container-etape">
          <h3 className="custom-subtitle">Hierarchical Decomposition of Criteria</h3>
          <div id="treeWrapper" style={{ width: '100%', height: '600px' }}>
            <Tree data={getTreeData()} orientation="vertical" />
          </div>
          <Button onClick={() => setShowGraph(true)}>Show Graph</Button>
        </div>
      )}

      {showGraph && (
        <div className="container-etape">
          <h3 className="custom-subtitle">Graphical Representation</h3>
          <Bar data={getChartData()} options={{ responsive: true }} />
        </div>
      )}

      {subCriteriaMatrices.length > 0 && subCriteriaMatrices.map((matrix, index) => (
        <div className="container-etape" key={index}>
          <h3 className="custom-subtitle">Sub-Criteria Matrix for Criterion {index + 1}</h3>
          <Table bordered responsive>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, colIndex) => (
                    <td key={colIndex}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="custom-subtitle">CR Value: {crValues[index]}</p>
        </div>
      ))}
    </Container>
  );
};

export default FAHP;
