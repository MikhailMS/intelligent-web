import React, { Component } from 'react';
import { Card, Row, Badge, Col } from 'antd';
import Linkify from 'react-linkify';

// setup config variables
const linkifyProperties = { target: '_blank' };

class TwitterCard extends Component {

    /**
     * Renders a Twitter Card
     */
    render() {
        const { tweet } = this.props; // tweet prop supplied from parent
        // create card title
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
        // link to twitter
        const tweetLink = (
            <a target="_blank" rel="noopener noreferrer" href={tweet.tweet_url}>Link</a>
        );
        // time tweeted
        const tweetTime = tweet.date_time.time.split(':');

        // make card
        return (
            <Card
                className="card"
                title={cardTitle}
                extra={tweetLink}
            >
                <Row>
                    <Col span={22}>
                        <Linkify properties={linkifyProperties} >{tweet.text}</Linkify>
                    </Col>
                    <Col span={2}>
                        <Row>
                            <p>
                                {tweet.date_time.week_day},
                  {tweet.date_time.date} {tweet.date_time.month} {tweet.date_time.year}
                            </p>
                        </Row>
                    </Col>
                </Row>
                <Row>
                    <Col span={22} />
                    <Col span={2}>
                        <Row><p>{tweetTime[0]}:{tweetTime[1]} GMT</p></Row>
                    </Col>
                </Row>
            </Card>
        );
    }
}

export default TwitterCard;
