/**
 * GamePage - Minimalist placeholder for the game view
 * 
 * This is a simple placeholder component that displays the game code
 * and a list of players. The actual game UI with PixiJS will be
 * implemented in a future proposal.
 */

import { useParams, Link } from 'react-router-dom';
import { useLazyLoadQuery, graphql } from 'react-relay';
import { Container, Title, Button, Text } from '@mantine/core';
import type { GamePageQuery } from './__generated__/GamePageQuery.graphql';

const GamePageQueryGraphQL = graphql`
  query GamePageQuery($code: String!) {
    roomByCode(code: $code) {
      id
      code
      status
      players {
        id
        nickname
        isCreator
      }
    }
  }
`;

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  
  if (!code) {
    return (
      <Container size="sm" py="xl">
        <Title order={1}>Error</Title>
        <Text>No game code provided</Text>
        <Button component={Link} to="/">Back to Home</Button>
      </Container>
    );
  }
  
  const data = useLazyLoadQuery<GamePageQuery>(
    GamePageQueryGraphQL,
    { code },
  );
  
  if (!data.roomByCode) {
    return (
      <Container size="sm" py="xl">
        <Title order={1}>Game Not Found</Title>
        <Text>This game room doesn't exist.</Text>
        <Button component={Link} to="/" mt="md">Back to Home</Button>
      </Container>
    );
  }
  
  const room = data.roomByCode;
  
  return (
    <Container size="sm" py="xl">
      <Title order={1}>Game: {room.code}</Title>
      
      {/* Simple player list without styling */}
      <div style={{ marginTop: '2rem' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {room.players.map((player) => (
            <li key={player.id} style={{ marginBottom: '0.5rem' }}>
              Player ID: {player.id} - {player.nickname}
              {player.isCreator && ' (Creator)'}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Placeholder for future PixiJS canvas */}
      <div>This is a minimalist placeholder page showing the game code and player list.</div>
    </Container>
  );
}

