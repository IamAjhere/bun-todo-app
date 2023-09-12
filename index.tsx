import { renderToString } from 'react-dom/server';
const server = Bun.serve({
  hostname: 'localhost',
  port: 3000,
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
      return new Response(renderToString(<TodoList todos={todos} />));
    }
    if (request.method === 'POST') {
      const { todo } = await request.json();
      const newTodo = {
        id: nextId++,
        text: todo,
        completed: false,
        createdAt: new Date(),
      };
      todos.push(newTodo);
      return new Response(renderToString(<TodoList todos={todos} />));
    }
  }
  if (url.pathname === '/complete-todo' && request.method === 'POST') {
    console.log();
    return new Response(renderToString(<TodoList todos={todos} />));
  }

  return new Response(Bun.file('404.html'), { status: 404 });
}
function TodoList(props: { todos: Todo[] }) {
  return (
    <div className='container'>
      {todos.length > 0 ? (
        todos.map((todo) => (
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
              ></i>
              <i className='bx bx-trash delete-button'></i>
            </div>
          </div>
        ))
      ) : (
        <div>Todo List is Empty</div>
      )}
    </div>
  );
}
