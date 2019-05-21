import React from 'react';

const { Link } = require('react-router-dom');
const { MDBAlert, MDBContainer, MDBRow, MDBCol, MDBIcon } = require("mdbreact");

const Root: React.FC = () => {
  return <MDBContainer className="mt-3">
    <MDBAlert color="success">
      <h5><MDBIcon icon="door-closed"/> 入場業務</h5>
    </MDBAlert>
    <MDBRow>
      <MDBCol size="4" className="text-center">
        <Link to="/scan" className="text-success">
          <MDBIcon icon="qrcode" size="9x"/>
          <h5 className="mt-3">入場処理</h5>
        </Link>
      </MDBCol>
      <MDBCol size="4" className="text-center">
        <Link to="/register" className="text-success">
          <MDBIcon icon="book" size="9x"/>
          <h5 className="mt-3">見本誌登録</h5>
        </Link>
      </MDBCol>
      <MDBCol size="4" className="text-center">
        <Link to="/register" className="text-success">
          <MDBIcon icon="chart-bar" size="9x"/>
          <h5 className="mt-3">処理状況</h5>
        </Link>
      </MDBCol>
    </MDBRow>
  </MDBContainer>;
}

export default Root;
