import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import FAHP from './Fahp';
import FTOPSIS from './Topsis';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const email = Cookies.get('email');
    try {
      await axios.post('http://127.0.0.1:5000/logout', { email });
      Cookies.remove('token');
      Cookies.remove('email');
      navigate('/');
    } catch (err) {
      console.error('Error during logout', err);
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>PFA</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/home/fahp">FuzzyAHP</Nav.Link>
              <Nav.Link as={Link} to="/home/ftopsis">FuzzyTOPSIS</Nav.Link>
            </Nav>
            <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="fahp" element={<FAHP />} />
          <Route path="ftopsis" element={<FTOPSIS />} />
        </Routes>
      </Container>
    </>
  );
};

export default Home;
