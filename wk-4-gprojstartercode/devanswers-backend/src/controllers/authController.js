import {
  register as registerUser,
  login as loginUser
} from '../services/userService.js';

// Forward profile credentials only; public callers cannot choose an admin role.
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await registerUser(name, email, password);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const { token, userId, name } = await loginUser(email, password);

  res.status(200).json({
    success: true,
    message: "Login Successful",
    data: {
      token,
      userId,
      name
    }
  });
};