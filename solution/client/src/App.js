import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Layout, Row, Col, Input, Tag, Tabs, Card, Badge, Switch } from 'antd';
import io from 'socket.io-client';
import Linkify from 'react-linkify';
import 'typeface-roboto';
import './App.css';

// setup useful variables
const { Header, Footer, Content } = Layout;
const Search = Input.Search;
const { TabPane } = Tabs;
const socket = io('/');
const linkifyProperties = {
  target: '_blank'
};
let newResults = [];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchReceived: false,
      streamChecked: false,
      streaming: false,
      twitResults: {},
      query: ''
    };
  }

  /**
  * Fires on user search. Emits the query to the server.
  * Handles the Twitter search response by setting internal app state
  */
  onSearch = (query) => {
    this.handleSearch(query);
  };

  /**
  * Handles the server Twitter search response. Saves user query to app state.
  */
  handleSearch = (query) => { //eslint-disable-line
    socket.emit('close-stream', '');
    this.setState({
      query,
      streamChecked: false,
    });
    socket.emit('search-query', {
        query: query,
        db_only: false
    });
    if (!(socket.hasListeners('search-result'))) {
      socket.on('search-result', (res) => {
        this.setState({
          searchReceived: true,
          twitResults: res
        });
      });
    }
  };

  /**
  * Fires on user stream. Emits the query to the server.
  * Handles the Twitter stream response by setting internal app state.
  */
  onStreamSwitch = (checked) => {
    const { query } = this.state;
    this.setState({
      streamChecked: !this.state.streamChecked
    });
    if (checked) {
      socket.emit('stream-query', query);
      this.handleStream();
    } else {
      socket.emit('close-stream', '');
      this.setState({
        streaming: false
      });
    }
  };

  /**
  * Handles the server Twitter search response. Saves user query to app state.
  */
  handleStream = () => {
    this.setState({
      streaming: true,
    });
    if (!(socket.hasListeners('stream-result'))) {
      socket.on('stream-result', (res) => {
        const { twitResults } = this.state;
        newResults = [res].concat(twitResults);
        this.setState({
          twitResults: newResults
        });
      });
    }
  }

  /**
   * Renders a tweet card
   */
  renderCard = (tweet, key) => {
    // top title part of card
    const cardTitle = (
      <Row>
        <Badge>
          <a href={tweet.profile_url}>
            <img
              className="profileImg"
              alt="profile"
              src={tweet.avatar_url}
            />
          </a>
        </Badge>
        <a target="_blank" rel="noopener noreferrer" href={tweet.profile_url}>
          {tweet.author_name}
        </a>
      </Row>
    );
    const tweetLink = (
      <a target="_blank" rel="noopener noreferrer" href={tweet.tweet_url}>Link</a>
    );

    // make card
    return (
      <div key={tweet.tweet_id}>
        <Card
          className="card"
          title={cardTitle}
          extra={tweetLink}
          key={key}
        >
          <Row>
            <Col span={22}>
              <Linkify properties={linkifyProperties} >{tweet.text}</Linkify>
            </Col>
            <Col span={2}>
              <Row><p>{tweet.date_time.week_day}, {tweet.date_time.date} {tweet.date_time.month} {tweet.date_time.year}</p></Row>
            </Col>
          </Row>
          <Row>
            <Col span={22} />
            <Col span={2}>
              <Row><p>{tweet.date_time.time} GMT</p></Row>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  /**
   * Renders the whole Twitter Search and Stream Feed
   */
  renderFeed = () => {
    const { twitResults, streamChecked, searchReceived } = this.state;
    if (searchReceived) {
      const tweetCards = twitResults.map((el, key) => this.renderCard(el, key));
      return (
        <div className="feed">
          <Row>
            <Switch
              checked={streamChecked}
              className="switch"
              checkedChildren={'Stream'}
              unCheckedChildren={'Stream'}
              onChange={(checked) => this.onStreamSwitch(checked)}
            />
          </Row>
          <Row>
            <CSSTransitionGroup
              transitionName="example"
              transitionAppear={true} //eslint-disable-line
              transitionAppearTimeout={500}
              transitionEnterTimeout={500}
              transitionLeaveTimeout={300}
            >
              {tweetCards}
            </CSSTransitionGroup>
          </Row>
        </div>
      );
    }
  }

  /**
   * Main app render function. Renders React's Virtual DOM.
   */
  render() {
    return (
      <div className="App">
        <Layout style={{ minHeight: '100vh' }}>
          <Header className="header">Twitter Football Transfers Rumours Search</Header>
          <Content className="content" >
            <Row className="row" type="flex" justify="center">
              <Col span={18}>
                <Search
                  className="searchBar"
                  size="large"
                  placeholder="Query search. For example, '@ibra_official AND #manutd AND from:@WayneRooney' "
                  onSearch={(value) => this.onSearch(value)}
                />
              </Col>
            </Row>
            <Row className="row" type="flex" justify="center">
              <Col span={18}>
                <Tabs
                  defaultActiveKey="1"
                  onChange={() => console.log('tab changed')}
                >
                  <TabPane tab="Feed" key="1">{this.renderFeed()}</TabPane>
                  <TabPane tab="Database" key="2">DB twitResults</TabPane>
                  <TabPane tab="Statistics" key="3">Stats</TabPane>
                </Tabs>
              </Col>
            </Row>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Maintained by Northern Lights Team. All bugs to be reported at <Tag><a target="_blank" rel="noopener noreferrer" href="https://github.com/MikhailMS/intelligent-web">Northern Lights Team</a></Tag>
          </Footer>
        </Layout>
      </div >
    );
  }
}

export default App;
