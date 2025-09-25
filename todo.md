 🏗️ System Architecture & Tech Stack

  Frontend Stack:
  - React 18+ (modern hooks, functional components)
  - Mantine UI (component library, theming)
  - Apollo Client (GraphQL client, caching)
  - TypeScript (type safety)

  Backend Stack:
  - Flask (web framework) // Note: plan changed, update to use FastAPI + Strawberry instead !
  - SQLAlchemy (ORM)
  - Flask-GraphQL + Graphene (GraphQL server) // Note: plan changed, update to use  FastAPI + Strawberry instead !
  - SQLite/PostgreSQL (database)

  Architecture Pattern:
  - Single Page Application (SPA)
  - GraphQL API-first design
  - Stateless backend with JWT auth (future)

  ---
  📊 Database Schema Design

  Todo Model:
  from sqlalchemy import Column, Integer, String, Boolean, DateTime
  from sqlalchemy.ext.declarative import declarative_base
  from datetime import datetime

  Base = declarative_base()

  class Todo(Base):
      __tablename__ = 'todos'

      id = Column(Integer, primary_key=True)
      title = Column(String(255), nullable=False)
      finished = Column(Boolean, default=False, nullable=False)
      created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

      def __repr__(self):
          return f'<Todo(id={self.id}, title="{self.title}", finished={self.finished})>'

  Database Initialization:
  from sqlalchemy import create_engine
  from sqlalchemy.orm import sessionmaker

  # Database configuration
  DATABASE_URL = "sqlite:///todos.db"  # or PostgreSQL URL
  engine = create_engine(DATABASE_URL)
  SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

  # Create tables
  Base.metadata.create_all(bind=engine)

⏺ 🔌 GraphQL API Design

  GraphQL Schema:
  import graphene
  from graphene import relay
  from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
  from models import Todo as TodoModel, SessionLocal

  class Todo(SQLAlchemyObjectType):
      class Meta:
          model = TodoModel
          interfaces = (relay.Node,)

  class Query(graphene.ObjectType):
      node = relay.Node.Field()
      todos = graphene.List(Todo)
      todo = graphene.Field(Todo, id=graphene.Int(required=True))

      def resolve_todos(self, info):
          query = Todo.get_query(info)
          return query.all()

      def resolve_todo(self, info, id):
          return SessionLocal().query(TodoModel).get(id)

  class CreateTodo(graphene.Mutation):
      class Arguments:
          title = graphene.String(required=True)

      todo = graphene.Field(Todo)

      def mutate(self, info, title):
          session = SessionLocal()
          todo = TodoModel(title=title)
          session.add(todo)
          session.commit()
          session.refresh(todo)
          session.close()
          return CreateTodo(todo=todo)

  class ToggleTodo(graphene.Mutation):
      class Arguments:
          id = graphene.Int(required=True)

      todo = graphene.Field(Todo)

      def mutate(self, info, id):
          session = SessionLocal()
          todo = session.query(TodoModel).get(id)
          if todo:
              todo.finished = not todo.finished
              session.commit()
              session.refresh(todo)
          session.close()
          return ToggleTodo(todo=todo)

  class DeleteTodo(graphene.Mutation):
      class Arguments:
          id = graphene.Int(required=True)

      success = graphene.Boolean()

      def mutate(self, info, id):
          session = SessionLocal()
          todo = session.query(TodoModel).get(id)
          success = False
          if todo:
              session.delete(todo)
              session.commit()
              success = True
          session.close()
          return DeleteTodo(success=success)

  class Mutation(graphene.ObjectType):
      create_todo = CreateTodo.Field()
      toggle_todo = ToggleTodo.Field()
      delete_todo = DeleteTodo.Field()

  schema = graphene.Schema(query=Query, mutation=Mutation)

  Flask Integration:
  from flask import Flask
  from flask_graphql import GraphQLView
  from flask_cors import CORS

  app = Flask(__name__)
  CORS(app)

  app.add_url_rule(
      '/graphql',
      view_func=GraphQLView.as_view(
          'graphql',
          schema=schema,
          graphiql=True  # Enable GraphiQL for development
      )
  )

  if __name__ == '__main__':
      app.run(debug=True)

⏺ ⚛️ React Component Architecture

  Component Structure:
  src/
  ├── components/
  │   ├── TodoApp.tsx          # Main container
  │   ├── TodoList.tsx         # Todo list display
  │   ├── TodoItem.tsx         # Individual todo item
  │   ├── TodoForm.tsx         # Add todo form
  │   └── Layout.tsx           # App layout wrapper
  ├── graphql/
  │   ├── queries.ts           # GraphQL queries
  │   ├── mutations.ts         # GraphQL mutations
  │   └── client.ts            # Apollo client setup
  ├── types/
  │   └── todo.ts              # TypeScript interfaces
  └── App.tsx                  # Root component

  Core Components:

  TodoApp.tsx (Main Container):
  import { useState } from 'react';
  import { Container, Title, Space } from '@mantine/core';
  import { useQuery } from '@apollo/client';
  import { GET_TODOS } from '../graphql/queries';
  import TodoForm from './TodoForm';
  import TodoList from './TodoList';
  import Layout from './Layout';

  interface Todo {
    id: number;
    title: string;
    finished: boolean;
    createdAt: string;
  }

  export default function TodoApp() {
    const { data, loading, error, refetch } = useQuery(GET_TODOS);

    return (
      <Layout>
        <Container size="md">
          <Title order={1} align="center">Todo List</Title>
          <Space h="md" />
          <TodoForm onTodoAdded={() => refetch()} />
          <Space h="lg" />
          <TodoList 
            todos={data?.todos || []} 
            loading={loading}
            onTodoUpdated={() => refetch()}
          />
        </Container>
      </Layout>
    );
  }

  TodoList.tsx:
  import { Stack, Loader, Text } from '@mantine/core';
  import TodoItem from './TodoItem';
  import { Todo } from '../types/todo';

  interface TodoListProps {
    todos: Todo[];
    loading: boolean;
    onTodoUpdated: () => void;
  }

  export default function TodoList({ todos, loading, onTodoUpdated }: TodoListProps) {
    if (loading) return <Loader size="md" />;

    if (!todos.length) {
      return <Text align="center" color="dimmed">No todos yet. Add one above!</Text>;
    }

    return (
      <Stack spacing="sm">
        {todos.map(todo => (
          <TodoItem 
            key={todo.id} 
            todo={todo} 
            onUpdate={onTodoUpdated}
          />
        ))}
      </Stack>
    );
  }

  TodoItem.tsx:
  import { Paper, Group, Text, Checkbox, ActionIcon, Badge } from '@mantine/core';
  import { IconTrash } from '@tabler/icons-react';
  import { useMutation } from '@apollo/client';
  import { TOGGLE_TODO, DELETE_TODO } from '../graphql/mutations';
  import { Todo } from '../types/todo';

  interface TodoItemProps {
    todo: Todo;
    onUpdate: () => void;
  }

  export default function TodoItem({ todo, onUpdate }: TodoItemProps) {
    const [toggleTodo] = useMutation(TOGGLE_TODO);
    const [deleteTodo] = useMutation(DELETE_TODO);

    const handleToggle = async () => {
      await toggleTodo({ variables: { id: todo.id } });
      onUpdate();
    };

    const handleDelete = async () => {
      await deleteTodo({ variables: { id: todo.id } });
      onUpdate();
    };

    return (
      <Paper p="md" shadow="sm" radius="md">
        <Group position="apart">
          <Group>
            <Checkbox 
              checked={todo.finished}
              onChange={handleToggle}
            />
            <div>
              <Text 
                strikethrough={todo.finished}
                color={todo.finished ? 'dimmed' : 'black'}
              >
                {todo.title}
              </Text>
              <Text size="xs" color="dimmed">
                Created: {new Date(todo.createdAt).toLocaleDateString()}
              </Text>
            </div>
          </Group>
          <Group spacing="xs">
            <Badge color={todo.finished ? 'green' : 'blue'} size="sm">
              {todo.finished ? 'Done' : 'Pending'}
            </Badge>
            <ActionIcon 
              color="red" 
              onClick={handleDelete}
              variant="subtle"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>
    );
  }

  TodoForm.tsx:
  import { useState } from 'react';
  import { TextInput, Button, Group, Paper } from '@mantine/core';
  import { useMutation } from '@apollo/client';
  import { CREATE_TODO } from '../graphql/mutations';

  interface TodoFormProps {
    onTodoAdded: () => void;
  }

  export default function TodoForm({ onTodoAdded }: TodoFormProps) {
    const [title, setTitle] = useState('');
    const [createTodo, { loading }] = useMutation(CREATE_TODO);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      await createTodo({ variables: { title: title.trim() } });
      setTitle('');
      onTodoAdded();
    };

    return (
      <Paper p="md" shadow="sm" radius="md">
        <form onSubmit={handleSubmit}>
          <Group>
            <TextInput
              placeholder="Enter a new todo..."
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              style={{ flex: 1 }}
              required
            />
            <Button type="submit" loading={loading}>
              Add Todo
            </Button>
          </Group>
        </form>
      </Paper>
    );
  }

  GraphQL Operations:

  queries.ts:
  import { gql } from '@apollo/client';

  export const GET_TODOS = gql`
    query GetTodos {
      todos {
        id
        title
        finished
        createdAt
      }
    }
  `;

  mutations.ts:
  import { gql } from '@apollo/client';

  export const CREATE_TODO = gql`
    mutation CreateTodo($title: String!) {
      createTodo(title: $title) {
        todo {
          id
          title
          finished
          createdAt
        }
      }
    }
  `;

  export const TOGGLE_TODO = gql`
    mutation ToggleTodo($id: Int!) {
      toggleTodo(id: $id) {
        todo {
          id
          finished
        }
      }
    }
  `;

  export const DELETE_TODO = gql`
    mutation DeleteTodo($id: Int!) {
      deleteTodo(id: $id) {
        success
      }
    }
  `;

⏺ 🗺️ Implementation Roadmap

  Phase 1: Backend Setup (Day 1)

  Priority: High | Est: 4-6 hours

  1. Environment Setup
  pip install Flask Flask-GraphQL graphene graphene-sqlalchemy Flask-CORS
  2. Core Files to Create:
    - models.py - SQLAlchemy Todo model
    - schema.py - GraphQL schema & resolvers
    - app.py - Flask application setup
    - requirements.txt - Python dependencies
  3. Database Initialization:
    - SQLite database creation
    - Table schema setup
    - Test data insertion
  4. GraphQL Endpoint:
    - /graphql endpoint configuration
    - GraphiQL interface setup
    - CORS configuration for frontend

  Phase 2: Frontend Foundation (Day 1-2)

  Priority: High | Est: 6-8 hours

  1. React Project Setup:
  npx create-react-app todo-app --template typescript
  npm install @mantine/core @mantine/hooks @apollo/client graphql
  2. Apollo Client Configuration:
    - GraphQL client setup
    - Connection to backend endpoint
    - Query/mutation definitions
  3. Mantine Integration:
    - Theme provider setup
    - Component library integration
    - Basic styling configuration

  Phase 3: Core Features (Day 2)

  Priority: High | Est: 4-6 hours

  1. Todo Display (READ):
    - TodoList component
    - TodoItem component
    - GraphQL query integration
  2. Todo Creation (CREATE):
    - TodoForm component
    - Create mutation integration
    - Form validation
  3. Todo Management (UPDATE/DELETE):
    - Toggle finished state
    - Delete functionality
    - Optimistic UI updates

  Phase 4: Polish & Testing (Day 3)

  Priority: Medium | Est: 2-4 hours

  1. UI/UX Enhancements:
    - Loading states
    - Error handling
    - Empty state messaging
    - Responsive design
  2. Testing:
    - Backend API testing
    - Frontend component testing
    - End-to-end workflow testing

  Phase 5: Deployment (Optional)

  Priority: Low | Est: 2-3 hours

  1. Production Preparation:
    - Environment variables
    - Production database setup
    - Build optimization
  2. Deployment Options:
    - Heroku (backend)
    - Vercel/Netlify (frontend)
    - Docker containerization

  ---
  📋 Technical Specifications

  API Endpoints:
  - POST /graphql - GraphQL API endpoint
  - GET /graphql - GraphiQL interface (dev only)

  GraphQL Operations:
  - Query.todos - Fetch all todos
  - Query.todo(id) - Fetch single todo
  - Mutation.createTodo(title) - Create new todo
  - Mutation.toggleTodo(id) - Toggle completion status
  - Mutation.deleteTodo(id) - Delete todo

  Data Flow:
  1. React component triggers GraphQL mutation/query
  2. Apollo Client sends request to Flask GraphQL endpoint
  3. Graphene resolvers interact with SQLAlchemy models
  4. Database operations performed via SQLAlchemy ORM
  5. Response returned through GraphQL → Apollo → React component

  Key Dependencies:
  // Frontend (package.json)
  {
    "@apollo/client": "^3.8.0",
    "@mantine/core": "^7.0.0",
    "react": "^18.2.0",
    "typescript": "^4.9.0"
  }

  # Backend (requirements.txt)
  Flask==2.3.3
  Flask-GraphQL==2.0.1
  graphene==3.3.0
  graphene-sqlalchemy==3.0.0
  SQLAlchemy==1.4.51
  Flask-CORS==4.0.0

⏺ ✅ Design Complete

  Your Todo app design is ready for implementation with:

  🏗️ Architecture: React/Mantine frontend ↔ GraphQL API ↔ Flask/SQLAlchemy backend

  📊 Data Model: Simple Todo entity with id, title, finished, created_at

  🔌 API: GraphQL mutations & queries for CRUD operations

  ⚛️ Components: Modular React components with TypeScript & Mantine UI

  🗺️ Roadmap: 3-day implementation plan with clear phases
