export default function Navbar({ title }) {
  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded-xl"
      >
        Logout
      </button>
    </div>
  );
}