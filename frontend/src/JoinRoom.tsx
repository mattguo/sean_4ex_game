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

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, graphql, useRelayEnvironment } from 'react-relay';
import { fetchQuery } from 'relay-runtime';
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
import type { JoinRoomCheckQuery } from './__generated__/JoinRoomCheckQuery.graphql';

const ROOM_CHECK_QUERY = graphql`
  query JoinRoomCheckQuery($code: String!) {
    roomByCode(code: $code) {
      id
      code
      status
      players {
        id
        nickname
        isCreator
        joinedAt
      }
    }
  }
`;

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
  const environment = useRelayEnvironment();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCheckLoading, setRoomCheckLoading] = useState(true);
  const [roomCheckError, setRoomCheckError] = useState<string | null>(null);
  
  const [commitMutation, isMutationInFlight] = useMutation<JoinRoomMutationType>(
    JoinRoomMutationGraphQL
  );

  // Check room status immediately on mount
  useEffect(() => {
    if (!code) {
      setRoomCheckLoading(false);
      return;
    }

    const checkRoomStatus = async () => {
      try {
        setRoomCheckLoading(true);
        const response = await fetchQuery<JoinRoomCheckQuery>(
          environment,
          ROOM_CHECK_QUERY,
          { code }
        ).toPromise();

        if (!response?.roomByCode) {
          setRoomCheckError('ROOM_NOT_FOUND');
          setRoomCheckLoading(false);
          return;
        }

        const room = response.roomByCode;
        const playerCount = room.players.length;

        // Check if room is already started
        if (room.status === 'ACTIVE') {
          setRoomCheckError('ROOM_ALREADY_STARTED');
          setRoomCheckLoading(false);
          return;
        }

        // Check if room is full
        if (playerCount >= 4) {
          setRoomCheckError('ROOM_FULL');
          setRoomCheckLoading(false);
          return;
        }

        // Room is valid and can be joined
        setRoomCheckError(null);
        setRoomCheckLoading(false);
      } catch (err) {
        console.error('Failed to check room status:', err);
        setRoomCheckError('ROOM_NOT_FOUND');
        setRoomCheckLoading(false);
      }
    };

    checkRoomStatus();
  }, [code, environment]);
  
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

  // Show loading state while checking room status
  if (roomCheckLoading) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="lg" align="center">
          <Title order={1}>Checking Room...</Title>
          <Text c="dimmed">Verifying room status...</Text>
        </Stack>
      </Container>
    );
  }

  // Show error if room is invalid, full, or already started
  if (roomCheckError) {
    const errorMessage = ERROR_MESSAGES[roomCheckError] || 'Unable to join this room.';
    return (
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <div>
            <Title order={1}>Cannot Join Room</Title>
            <Text c="dimmed" mt="sm">
              Room Code: <strong>{code}</strong>
            </Text>
          </div>
          
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Error" 
            color="red"
          >
            {errorMessage}
          </Alert>
          
          <Button component={Link} to="/" fullWidth>
            Back to Home
          </Button>
        </Stack>
      </Container>
    );
  }
  
  // Show joined lobby after successful join
  if (joined && playerId) {
    return <JoinedLobby code={code} playerId={playerId} />;
  }
  
  // Show join form (only if room is valid and can be joined)
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

