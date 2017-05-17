import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link, Redirect } from 'react-router-dom';
import { Layout, Row, Col, Tag, Menu } from 'antd';
import 'typeface-roboto';
import './App.css';
import Feed from './Feed';
import Database from './Database';

// destructure useful Layout and UI components
const { Header, Footer, Content } = Layout;

/**
 * Main client App component
 */
class App extends Component {

  /**
   * Main App render function. Renders React's Virtual DOM.
   */
  render() { // eslint-disable-line
    return (
      <Router>
        <div className="App">
          <Redirect from="/" to="/feed" /> {/* redirect to Feed as home page */}
          <Layout style={{ minHeight: '100vh' }}>
            <Header className="header">
              <Row>
                <Col span={14} >
                  <div className="mainTitle"><p>
                    <a href="/">Transfer Rumours Tool</a>
                  </p>
                  </div>
                </Col>
                <div className="navWrapper">
                  <Col span={10}>
                    <Menu
                      mode="horizontal"
                      defaultSelectedKeys={['1']}
                      style={{ lineHeight: '50px', minWidth: 150, backgroundColor: 'transparent', marginTop: '7px', borderBottomColor: 'transparent' }}
                    >
                      <Menu.Item className="navItem" key="1">
                        <Link to={'/feed'}>Feed</Link>
                      </Menu.Item>
                      <Menu.Item className="navItem" key="2">
                        <Link to={'/db'}>Database</Link>
                      </Menu.Item>
                    </Menu>
                  </Col>
                </div>
              </Row>
            </Header>
            <Content className="content" >
              <Route path='/feed' component={Feed} />
              <Route path='/db' component={Database} />
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Maintained by Northern Lights Team. All bugs to be reported at <Tag><a target="_blank" rel="noopener noreferrer" href="https://github.com/MikhailMS/intelligent-web">Northern Lights Team</a></Tag>
            </Footer>
          </Layout>
        </div>
      </Router>
    );
  }
}

export default App;
