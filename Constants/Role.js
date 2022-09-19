function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true,
  });
}

// Roles
define("ADMIN", "Admin");
define("USER", "User");
define("VENDOR", "vendor");
