import React, { Component } from 'react';
import { Card, Row, Col } from 'antd';

class PlayerCard extends Component {

    /**
     * Renders a player card
     */
    render() {
        const { playerData } = this.props; // data supplied as prop from parent

        // process data. prepare for rendering
        const birthDate = playerData.birth_date.split('-');
        // use standard European date/time format
        const birthDateString = `${birthDate[2]}\\${birthDate[1]}\\${birthDate[0]}`;
        // limit abstract to 3 sentences
        const abstract = playerData.abstract.split('. ');
        const abstractString = `${abstract[0]}. ${abstract[1]}. ${abstract[2]}.`;
        let position = playerData.position.split(' ');
        position = position[0]; // limit to only 1 word

        return (
            <Card className="playerCard" bodyStyle={{ padding: 0 }}>
                <Col span={6} className="cardLeft">
                    <div className="custom-image">
                        <img alt="player" src={playerData.thumbnail_url} />
                    </div>
                </Col>
                <Col span={18} className="cardRight">
                    <div className="custom-card">
                        <div className="playerCardTitle">
                            <Col span={9}>
                                <h3>{playerData.fullname}</h3>
                                <h3>{birthDateString}</h3>
                            </Col>
                            <Col span={5} offset={10}>
                                <Row><h3 className="right">{playerData.current_club}</h3></Row>
                                <Row><h3 className="right">{position}</h3></Row>
                            </Col>
                        </div>
                        <div className="playerCardContent">
                            <p>{abstractString}</p>
                        </div>
                    </div>
                </Col>
            </Card>
        );
    }
}

export default PlayerCard;
