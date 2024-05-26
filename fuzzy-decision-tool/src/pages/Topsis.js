import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Container, Row, Col, Button, Form, Table } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';

const FuzzyTopsisTester = () => {
  const [projectName, setProjectName] = useState('');
  const [numCriteria, setNumCriteria] = useState('');
  const [criteriaNames, setCriteriaNames] = useState([]);
  const [decisionMatrix, setDecisionMatrix] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleNumCriteriaChange = (e) => {
    const newNumCriteria = parseInt(e.target.value, 10);
    if (!isNaN(newNumCriteria) && newNumCriteria > 0) {
      setNumCriteria(newNumCriteria);
      const newCriteriaNames = Array(newNumCriteria).fill('');
      setCriteriaNames(newCriteriaNames);
      const newMatrix = Array.from({ length: newNumCriteria }, (_, i) => 
        Array.from({ length: newNumCriteria }, (_, j) => (i === j ? 1 : ''))
      );
      setDecisionMatrix(newMatrix);
    } else {
      setNumCriteria('');
      setCriteriaNames([]);
      setDecisionMatrix([]);
    }
  };

  const handleCriteriaNameChange = (index, value) => {
    const newCriteriaNames = [...criteriaNames];
    newCriteriaNames[index] = value;
    setCriteriaNames(newCriteriaNames);
  };

  const handleMatrixChange = (rowIndex, colIndex, value) => {
    const newMatrix = [...decisionMatrix];
    const val = parseFloat(value);
    if (!isNaN(val)) {
      newMatrix[rowIndex][colIndex] = val;
      newMatrix[colIndex][rowIndex] = parseFloat((1 / val).toFixed(3));
      setDecisionMatrix(newMatrix);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('token');
      const result = await axios.post('http://127.0.0.1:5000/api/fuzzy-topsis', {
        decision_matrix: decisionMatrix,
        criteria_names: criteriaNames
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setResponse(result.data.rankings);
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!response) return {};

    const labels = Object.keys(response);
    const data = Object.values(response);

    return {
      labels,
      datasets: [
        {
          label: 'Criteria Rankings',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <Container>
      <h2 className="custom-title">Fuzzy TOPSIS Tester</h2>
      <Form onSubmit={handleSubmit}>
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
              onChange={handleNumCriteriaChange}
              min="1"
            />
          </Col>
        </Form.Group>
        {criteriaNames.map((_, i) => (
          <Form.Group as={Row} key={i}>
            <Form.Label column sm="2">
              Criterion {i + 1} Name:
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                value={criteriaNames[i] || ''}
                onChange={(e) => handleCriteriaNameChange(i, e.target.value)}
              />
            </Col>
          </Form.Group>
        ))}
        {numCriteria > 0 && (
          <div className="container-etape">
            <h3 className="custom-subtitle">Enter Decision Matrix:</h3>
            <Table bordered responsive>
              <tbody>
                {decisionMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((value, colIndex) => (
                      <td key={colIndex}>
                        <Form.Control
                          type="number"
                          value={value}
                          onChange={(e) => handleMatrixChange(rowIndex, colIndex, e.target.value)}
                          disabled={rowIndex === colIndex}
                          step="0.01"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button type="submit" disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Rankings'}
            </Button>
          </div>
        )}
      </Form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {response && (
        <div className="container-etape">
          <h3 className="custom-subtitle">Response:</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Ranking</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(response).map(([criterion, ranking]) => (
                <tr key={criterion}>
                  <td>{criterion}</td>
                  <td>{ranking}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <h3 className="custom-subtitle">Graphical Representation</h3>
          <Bar data={getChartData()} options={{ responsive: true }} />
        </div>
      )}
    </Container>
  );
};

export default FuzzyTopsisTester;
