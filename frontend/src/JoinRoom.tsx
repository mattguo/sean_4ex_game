/**
 * JoinRoom - Page for joining an existing game room
 * 
 * This component handles the room joining flow:
 * 1. Extract room code from URL
 * 2. Show join form with nickname input
 * 3. Validate nickname and call joinRoom mutation
 * 4. On success, show JoinedLobby component
 * 5. Handle various error states
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, graphql } from 'react-relay';
import { 
  Container, 
  Title, 
  Text, 
  TextInput, 
  Button, 
  Alert,
  Stack 
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { validateNickname } from './utils/validation';
import JoinedLobby from './JoinedLobby';
import type { JoinRoomMutation as JoinRoomMutationType } from './__generated__/JoinRoomMutation.graphql';

const JoinRoomMutationGraphQL = graphql`
  mutation JoinRoomMutation($code: String!, $nickname: String!) {
    joinRoom(code: $code, nickname: $nickname) {
      success
      error
      room {
        id
        code
        status
        players {
          id
          nickname
          isCreator
        }
      }
      player {
        id
        nickname
        isCreator
      }
    }
  }
`;

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  'ROOM_NOT_FOUND': 'Room not found. Please check the code.',
  'ROOM_ALREADY_STARTED': 'This game has already started.',
  'ROOM_FULL': 'This room is full (4/4 players).',
  'NICKNAME_TAKEN': 'This nickname is already taken in this room.',
  'INVALID_NICKNAME': 'Invalid nickname format.',
};

export default function JoinRoom() {
  const { code } = useParams<{ code: string }>();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  const [commitMutation, isMutationInFlight] = useMutation<JoinRoomMutationType>(
    JoinRoomMutationGraphQL
  );
  
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setValidationError(null);
    setError(null);
  };
  
  const handleJoin = () => {
    // Client-side validation
    const validationErr = validateNickname(nickname);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }
    
    if (!code) {
      setError('Invalid room code');
      return;
    }
    
    // Call mutation
    commitMutation({
      variables: { code, nickname: nickname.trim() },
      onCompleted: (data) => {
        if (data.joinRoom.success && data.joinRoom.player) {
          setPlayerId(data.joinRoom.player.id);
          setJoined(true);
        } else if (data.joinRoom.error) {
          // Map error code to user-friendly message
          const errorCode = data.joinRoom.error.split(':')[0];
          setError(ERROR_MESSAGES[errorCode] || data.joinRoom.error);
        }
      },
      onError: (err) => {
        setError(`Network error: ${err.message}`);
      }
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };
  
  // Show error page if no code in URL
  if (!code) {
    return (
      <Container size="sm" py="xl">
        <Title order={1}>Invalid Room Code</Title>
        <Text mt="md">No room code provided in the URL.</Text>
        <Button component={Link} to="/" mt="lg">
          Back to Home
        </Button>
      </Container>
    );
  }
  
  // Show joined lobby after successful join
  if (joined && playerId) {
    return <JoinedLobby code={code} playerId={playerId} />;
  }
  
  // Show join form
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Join Game</Title>
          <Text c="dimmed" mt="sm">
            Room Code: <strong>{code}</strong>
          </Text>
        </div>
        
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Error" 
            color="red"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}
        
        <TextInput
          label="Your Nickname"
          placeholder="Enter your nickname (3-20 characters)"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          error={validationError}
          disabled={isMutationInFlight}
          required
        />
        
        <Button 
          onClick={handleJoin}
          loading={isMutationInFlight}
          fullWidth
        >
          Join Game
        </Button>
        
        <Text size="sm" c="dimmed" ta="center">
          Ask the room creator for the join URL or code
        </Text>
      </Stack>
    </Container>
  );
}

