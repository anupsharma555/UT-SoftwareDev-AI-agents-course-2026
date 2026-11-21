import "./Header.css"

function Header({ onNavigate }) {
  const isAuthenticated = false;

   // Dummy authentication variable. Will be eventually replaced with actual authentication logic.

  const handleLogin = () => {
    console.log('Login clicked');
    onNavigate('login');
  };

  const handleSignup = () => {
    console.log('Signup clicked');
    onNavigate('register');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    onNavigate('login');
  };

  return (
    <header className="header">
      <h1 className="title">ThreadHive</h1>
      <div className="header-right">
        {isAuthenticated ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleSignup}> Register</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
