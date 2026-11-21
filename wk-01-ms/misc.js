// Part 1 Exercises (use Copilot inline suggestions)
// Function to calculate the factorial of a number
function factorial(n) {
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}

// Exercise 1: Comment-Driven Development
// Function to calculate the factorial of a number

// Exercise 2: Array Operations
const numList = [1, 2, 3, 4, 5];

// Filter even numbers
const evenNumbers = numList.filter((num) => num % 2 === 0);

// Map numbers to their squares
const squaredNumbers = numList.map((num) => num * num);

// Exercise 3: Function from Signature
// Type this on a new line and press Enter:
function reverseString(str) {
  return str.split("").reverse().join("");
}

// Exercise 4: Process User Data
function processUserData(users) {
  if (!Array.isArray(users)) {
    throw new TypeError("users must be an array");
  }

  return users.reduce((adults, user, index) => {
    if (!user || typeof user !== "object") {
      throw new TypeError(`users[${index}] must be an object`);
    }

    const { age, name, email } = user;
    if (typeof age !== "number" || !Number.isFinite(age)) {
      throw new TypeError(`users[${index}].age must be a finite number`);
    }
    if (typeof name !== "string" || typeof email !== "string") {
      throw new TypeError(`users[${index}] must include string name and email`);
    }

    if (age >= 18) {
      adults.push({ name, email });
    }
    return adults;
  }, []);
}
