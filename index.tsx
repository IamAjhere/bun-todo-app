import { renderToString } from 'react-dom/server';
const server = Bun.serve({
  hostname: 'localhost',
  port: 3001,
  fetch: fetchHandle,
});

console.log(`Bun Server is Running on ${server.hostname}:${server.port}`);

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
};
let todos: Todo[] = [];
let nextId = 1;

async function fetchHandle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '' || url.pathname === '/') {
    return new Response(Bun.file('index.html'));
  }

  if (url.pathname === '/todos') {
    if (request.method === 'GET') {
      const sort = url.searchParams.get('sort');
      console.log(sort, 'SORT OPTION');
      let sortedTodos = todos;
      if (sort === 'done') {
        sortedTodos = todos.filter((todo) => todo.completed);
      } else if (sort === 'undone') {
        sortedTodos = todos.filter((todo) => !todo.completed);
      }

      const todoListComponent = (
        <TodoList todos={sortedTodos} sort={sort || 'All'} />
      );
      const response = new Response(renderToString(todoListComponent));
      // Send the response
      return response;
    }
    if (request.method === 'POST') {
      const { todo } = await request.json();
      if (todo === '')
        new Response(renderToString(<TodoList todos={todos} sort={'All'} />));
      const newTodo = {
        id: nextId++,
        text: todo,
        completed: false,
        createdAt: new Date(),
      };
      todos.unshift(newTodo);
      return new Response(
        renderToString(<TodoList todos={todos} sort={'All'} />)
      );
    }
  }
  if (url.pathname === '/complete-todo' && request.method === 'POST') {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response('Missing "id" parameter', { status: 400 });
    }
    const ID = parseInt(id, 10);
    if (isNaN(ID)) {
      return new Response('Invalid "id" parameter', { status: 400 });
    }
    const updatedTodo = todos.find((todo) => todo.id === ID);
    if (!updatedTodo) {
      return new Response('Todo not found', { status: 404 });
    }
    updatedTodo.completed = !updatedTodo.completed;
    const updatedTodos = todos.map((todo) =>
      todo.id === ID ? updatedTodo : todo
    );
    return new Response(
      renderToString(<TodoList todos={updatedTodos} sort={'All'} />)
    );
  }
  if (url.pathname === '/delete-todo' && request.method === 'POST') {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response('Missing "id" parameter', { status: 400 });
    }
    const ID = parseInt(id, 10);
    if (isNaN(ID)) {
      return new Response('Invalid "id" parameter', { status: 400 });
    }
    const updatedTodo = todos.filter((todo) => todo.id !== ID);
    if (!updatedTodo) {
      return new Response('Todo not found', { status: 404 });
    }
    todos = updatedTodo;
    return new Response(
      renderToString(<TodoList todos={todos} sort={'All'} />)
    );
  }
  return new Response(Bun.file('404.html'), { status: 404 });
}
function TodoList(props: { todos: Todo[]; sort: string }) {
  const todos = props.todos;
  return (
    <div className='container'>
      {todos.length > 0
        ? todos.map((todo) => (
            <div
              key={todo.id}
              className='item'
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                className={`task-details ${todo.completed ? 'completed' : ''}`}
              >
                <div className='date' style={{ fontSize: 'small' }}>
                  {todo.createdAt.toLocaleDateString()}
                </div>
                <div>{todo.text}</div>
              </div>
              <div className='task-actions'>
                <i
                  className={`bx bx-check complete-button ${
                    todo.completed ? 'completed' : ''
                  }`}
                  hx-post={`/complete-todo?id=${todo.id}`}
                  hx-target='#todos'
                ></i>
                <i
                  className='bx bx-trash delete-button'
                  hx-post={`/delete-todo?id=${todo.id}`}
                  hx-target='#todos'
                ></i>
              </div>
            </div>
          ))
        : `${props.sort
            .charAt(0)
            .toUpperCase()
            .concat(props.sort.slice(1))} Todo List is Empty`}
    </div>
  );
}
