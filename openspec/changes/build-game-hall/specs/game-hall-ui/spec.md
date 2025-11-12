# Capability: Game Hall UI

**Change ID:** `build-game-hall`  
**Capability:** `game-hall-ui`  
**Status:** Draft

## Overview

Implement the frontend game hall landing page with room creation form using React, Mantine, and Relay.

## Dependencies

- Requires: `room-creation-api` (createRoom mutation must exist)
- Frontend libraries: React, Mantine, Relay (already installed)

## ADDED Requirements

### Requirement: Game Hall Page Component

The system SHALL provide a landing page for game hall functionality.

**Rationale:** Users need an entry point to start creating or joining game rooms.

#### Scenario: Game Hall page structure

**Given** the application loads  
**When** the user navigates to the root path "/"  
**Then** the GameHall component SHALL be displayed  
**And** it SHALL show a welcome title "Sean 4EX Game"  
**And** it SHALL show a brief description "Create a room to start playing with friends"  
**And** it SHALL contain a CreateRoomForm component

#### Scenario: Page uses Mantine components

**Given** the GameHall page is rendered  
**When** the page structure is examined  
**Then** it SHALL use Mantine components:
  - `Container` for page layout
  - `Title` for headings
  - `Text` for descriptions
  - `Paper` or `Card` for content sections
**And** it SHALL follow Mantine's responsive design patterns

### Requirement: Create Room Form Component

The system SHALL provide a form for users to create game rooms.

**Rationale:** Users need a simple interface to enter their nickname and create a room.

#### Scenario: Form displays required fields

**Given** the CreateRoomForm is rendered  
**When** the user views the form  
**Then** it SHALL display:
  - A `TextInput` field labeled "Your Nickname"
  - A placeholder text "Enter your nickname (3-20 characters)"
  - A submit button labeled "Create Room"
**And** the submit button SHALL be a Mantine `Button` component

#### Scenario: Form has initial state

**Given** the form is freshly rendered  
**When** no user interaction has occurred  
**Then** the nickname field SHALL be empty  
**And** the submit button SHALL be enabled  
**And** no error messages SHALL be displayed

### Requirement: Client-Side Form Validation

The system SHALL validate form input on the client before submission.

**Rationale:** Immediate feedback improves UX and reduces unnecessary API calls.

#### Scenario: Empty nickname shows error

**Given** the form is displayed  
**When** the user clicks "Create Room" without entering a nickname  
**Then** an error message SHALL appear below the input field  
**And** the message SHALL read "Nickname is required"  
**And** the form SHALL NOT submit to the API

#### Scenario: Short nickname shows error

**Given** the user enters "Ab" (2 characters)  
**When** the user attempts to submit  
**Then** an error message SHALL appear: "Nickname must be at least 3 characters"  
**And** the form SHALL NOT submit

#### Scenario: Long nickname shows error

**Given** the user enters 21 characters  
**When** the user attempts to submit  
**Then** an error message SHALL appear: "Nickname must be no more than 20 characters"  
**And** the form SHALL NOT submit

#### Scenario: Invalid characters show error

**Given** the user enters "Alice@123" (contains @)  
**When** the user attempts to submit  
**Then** an error message SHALL appear: "Only letters, numbers, and underscores allowed"  
**And** the form SHALL NOT submit

#### Scenario: Valid nickname clears errors

**Given** the user had an error displayed  
**When** the user corrects the input to a valid nickname "Alice"  
**Then** the error message SHALL disappear  
**And** the submit button SHALL be enabled

### Requirement: Room Creation via GraphQL Mutation

The system SHALL call the createRoom mutation when form is submitted.

**Rationale:** Integrate with backend API using the project's GraphQL stack.

#### Scenario: Mutation is called on valid submission

**Given** the user enters valid nickname "Bob"  
**When** the user clicks "Create Room"  
**Then** the Relay `useMutation` hook SHALL call `createRoom(nickname: "Bob")`  
**And** the request SHALL be sent to `/graphql` endpoint  
**And** the loading state SHALL be displayed

#### Scenario: Mutation uses Relay

**Given** the mutation needs to be defined  
**When** the mutation file is created  
**Then** it SHALL use Relay's `graphql` tag:
```typescript
const CreateRoomMutation = graphql`
  mutation CreateRoomMutation($nickname: String!) {
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
      }
    }
  }
`;
```

#### Scenario: Relay compiler generates types

**Given** the mutation is defined  
**When** `pnpm relay` is run  
**Then** TypeScript types SHALL be generated in `__generated__/`  
**And** the mutation hook SHALL be type-safe

### Requirement: Loading State During Submission

The system SHALL show loading feedback while creating a room.

**Rationale:** Users need to know their action is being processed.

#### Scenario: Loading state is displayed

**Given** the user submits the form  
**When** the mutation is in-flight  
**Then** the submit button SHALL show a loading spinner  
**And** the button SHALL be disabled  
**And** the button text SHALL change to "Creating..."  
**And** the nickname input SHALL be disabled

#### Scenario: Loading state ends on response

**Given** the mutation is in-flight  
**When** the server responds (success or error)  
**Then** the loading state SHALL end  
**And** the button SHALL return to normal state (if error)  
**And** the inputs SHALL be re-enabled (if error)

### Requirement: Success State Display

The system SHALL display the room code after successful creation.

**Rationale:** Users need to see and share their room code.

#### Scenario: Success message is displayed

**Given** the mutation succeeds  
**When** the response is received  
**Then** the form SHALL be hidden or replaced  
**And** a success message SHALL appear: "Room Created Successfully!"  
**And** the room code SHALL be displayed prominently  
**And** the code SHALL be styled with large, bold text (e.g., Mantine `Title` order 2)

#### Scenario: Room code is copyable

**Given** the room code "ABC123" is displayed  
**When** the user views the success screen  
**Then** a "Copy Code" button SHALL appear next to the code  
**And** clicking the button SHALL copy the code to clipboard  
**And** a notification SHALL appear: "Code copied!"  
**And** the notification SHALL use Mantine's `notifications` system

#### Scenario: Success screen shows next steps

**Given** the success screen is displayed  
**When** the user views the page  
**Then** instructional text SHALL appear:
  - "Share this code with your friends"
  - "Players can join using this code"
**And** a "Go to Lobby" button SHALL appear (grayed out / future feature)

### Requirement: Error Handling

The system SHALL display user-friendly errors when mutations fail.

**Rationale:** Users need clear feedback on what went wrong and how to fix it.

#### Scenario: Network error is displayed

**Given** the network is unavailable  
**When** the user submits the form  
**Then** an error message SHALL appear: "Unable to connect. Please check your connection and try again."  
**And** a "Retry" button SHALL be provided  
**And** the form inputs SHALL remain editable

#### Scenario: Validation error from server

**Given** server-side validation fails (e.g., nickname taken in future)  
**When** the mutation returns a validation error  
**Then** the error SHALL be displayed near the relevant form field  
**And** the error message SHALL match the server's response

#### Scenario: Generic server error

**Given** an unexpected server error occurs  
**When** the mutation returns a 500 error  
**Then** a user-friendly message SHALL appear: "Something went wrong. Please try again later."  
**And** the error SHALL be logged to console for debugging  
**And** the form SHALL remain usable for retry

### Requirement: Responsive Design

The system SHALL work on mobile and desktop screen sizes.

**Rationale:** Users may access the game from various devices.

#### Scenario: Mobile layout

**Given** the viewport width is 375px (mobile)  
**When** the page is rendered  
**Then** the container SHALL be full-width with appropriate padding  
**And** the form SHALL stack vertically  
**And** the button SHALL be full-width  
**And** text SHALL be readable without horizontal scrolling

#### Scenario: Desktop layout

**Given** the viewport width is 1920px (desktop)  
**When** the page is rendered  
**Then** the container SHALL be centered with max-width 600px  
**And** the form SHALL be comfortably sized  
**And** the layout SHALL use appropriate spacing

### Requirement: Accessibility

The system SHALL be accessible to users with disabilities.

**Rationale:** Inclusive design is a core value.

#### Scenario: Keyboard navigation

**Given** the user navigates via keyboard  
**When** the Tab key is pressed  
**Then** focus SHALL move to the nickname input  
**And** pressing Tab again SHALL move to the submit button  
**And** pressing Enter on the button SHALL submit the form

#### Scenario: Screen reader support

**Given** a screen reader is active  
**When** the form is focused  
**Then** field labels SHALL be announced  
**And** error messages SHALL be associated with their fields (aria-describedby)  
**And** the submit button state SHALL be announced (loading, enabled, disabled)

#### Scenario: Focus management

**Given** an error occurs  
**When** the error message appears  
**Then** focus SHALL remain on the form or move to the error message  
**And** focus SHALL NOT be trapped unexpectedly

## MODIFIED Requirements

### Requirement: Update App.tsx to show GameHall

The system SHALL update the main App component to display the GameHall page instead of the example FilmList.

**Original behavior:** App.tsx renders FilmList component as main content  
**Modified behavior:** App.tsx renders GameHall component as main content

**Rationale:** The FilmList is example code that should be replaced with the game hall landing page.

#### Scenario: App component renders GameHall

**Given** the application loads  
**When** App.tsx is rendered  
**Then** it SHALL render the GameHall component  
**And** it SHALL NOT render the FilmList component  
**And** the FilmList component MAY be moved to a separate route (future)

## Implementation Notes

### File Structure
```
frontend/src/
├── pages/
│   └── GameHall.tsx           # Main page component
├── components/
│   ├── CreateRoomForm.tsx     # Room creation form
│   └── RoomCodeDisplay.tsx    # Success state display
├── graphql/
│   └── mutations/
│       └── CreateRoom.ts      # Relay mutation definition
├── hooks/
│   └── useFormValidation.ts   # (Optional) Custom validation hook
└── App.tsx                    # Updated to render GameHall
```

### Example Component Structure
```typescript
// GameHall.tsx
export function GameHall() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} ta="center">Sean 4EX Game</Title>
      <Text ta="center" c="dimmed">
        Create a room to start playing with friends
      </Text>
      <CreateRoomForm />
    </Container>
  );
}

// CreateRoomForm.tsx
export function CreateRoomForm() {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [commit, isInFlight] = useMutation(CreateRoomMutation);
  
  // ... validation and submission logic
}
```

### Validation Implementation
```typescript
const validateNickname = (nickname: string): string | null => {
  if (!nickname) return 'Nickname is required';
  if (nickname.length < 3) return 'Nickname must be at least 3 characters';
  if (nickname.length > 20) return 'Nickname must be no more than 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    return 'Only letters, numbers, and underscores allowed';
  }
  return null;
};
```

### Testing Considerations
- Component unit tests with React Testing Library
- Form validation tests (all edge cases)
- Mutation mocking with Relay Mock Environment
- Integration tests with MSW (Mock Service Worker) for API
- Accessibility tests with jest-axe

