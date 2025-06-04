'use client';

export function DevLogin() {
  const handleLogin = () => {
    // Replace with your actual login logic
    console.log('Logged in with dev credentials');
    window.location.href = '/admin';
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-bold mb-2">Development Login</h3>
      <p className="text-sm mb-4">Email: dev@example.com</p>
      <p className="text-sm mb-4">Password: Devpassword123!</p>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Login as Developer
      </button>
    </div>
  );
}
