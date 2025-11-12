/**
 * GameHall Component
 * 
 * The main lobby interface where players can:
 * - Create a new game room
 * - View their current room details
 * - Copy room code to share with friends
 */

import { useState, Suspense } from 'react';
import { useMutation, graphql } from 'react-relay';
import {
  Container,
  Title,
  Paper,
  Stack,
  TextInput,
  Button,
  Text,
  Loader,
} from '@mantine/core';
import {
  IconUserPlus,
} from '@tabler/icons-react';
import type { GameHallCreateRoomMutation } from './__generated__/GameHallCreateRoomMutation.graphql';
import { validateNickname } from './utils/validation';
import CreatorLobby from './CreatorLobby';

/**
 * GraphQL mutation to create a new room.
 */
const CREATE_ROOM_MUTATION = graphql`
  mutation GameHallCreateRoomMutation($nickname: String!) {
    createRoom(nickname: $nickname) {
      room {
        id
        code
        gameType
        status
        createdAt
      }
      player {
        id
        nickname
        isCreator
        joinedAt
      }
    }
  }
`;

/**
 * GameHall component that displays room creation and management interface.
 */
export default function GameHall() {
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<
    GameHallCreateRoomMutation['response']['createRoom'] | null
  >(null);

  const [commitCreateRoom, isCreatingRoom] =
    useMutation<GameHallCreateRoomMutation>(CREATE_ROOM_MUTATION);

  /**
   * Handle nickname input change with validation.
   */
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    // Clear error on input change
    if (nicknameError) {
      setNicknameError(null);
    }
  };

  /**
   * Handle room creation form submission.
   */
  const handleCreateRoom = () => {
    // Validate nickname
    const error = validateNickname(nickname);
    if (error) {
      setNicknameError(error);
      return;
    }

    // Submit mutation
    commitCreateRoom({
      variables: { nickname: nickname.trim() },
      onCompleted: (response) => {
        setRoomData(response.createRoom);
        setNickname(''); // Clear form
      },
      onError: (error) => {
        setNicknameError(error.message);
      },
    });
  };

  /**
   * Render room creation form.
   */
  const renderCreateForm = () => (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Stack gap="md">
        <Title order={2}>Create New Room</Title>
        <Text size="sm" c="dimmed">
          Enter your nickname to create a game room and invite friends.
        </Text>

        <TextInput
          label="Your Nickname"
          placeholder="Enter 3-20 characters"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.currentTarget.value)}
          error={nicknameError}
          disabled={isCreatingRoom}
          leftSection={<IconUserPlus size={16} />}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isCreatingRoom) {
              handleCreateRoom();
            }
          }}
        />

        <Button
          onClick={handleCreateRoom}
          loading={isCreatingRoom}
          fullWidth
          size="lg"
        >
          Create Room
        </Button>
      </Stack>
    </Paper>
  );

  /**
   * Render creator lobby after room creation.
   */
  const renderCreatorLobby = () => {
    if (!roomData) return null;

    const { room, player } = roomData;

    return (
      <Suspense fallback={<Loader />}>
        <CreatorLobby
          roomCode={room.code}
          playerId={player.id}
          onCreateAnother={() => setRoomData(null)}
        />
      </Suspense>
    );
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} ta="center">
            Sean 4EX Game Hall
          </Title>
          <Text size="lg" c="dimmed" ta="center" mt="sm">
            Create or join a game room to start playing
          </Text>
        </div>

        {roomData ? renderCreatorLobby() : renderCreateForm()}
      </Stack>
    </Container>
  );
}

