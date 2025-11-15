# Contributing to GharSe

First off, thank you for considering contributing to GharSe! It's people like you that make GharSe such a great platform.

## 🎯 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**
* **Include your environment details** (OS, browser, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript and React styleguides
* Include thoughtfully-worded, well-structured tests
* Document new code based on the Documentation Styleguide
* End all files with a newline

## 🏗️ Development Process

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/GharSe.git
cd GharSe

# Add upstream remote
git remote add upstream https://github.com/techbantu/GharSe.git
```

### 2. Setup Development Environment

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Setup database
pnpm prisma:generate
pnpm db:setup

# Start development server
pnpm dev
```

### 3. Create a Branch

```bash
# Create a branch for your feature
git checkout -b feature/your-feature-name

# Or for a bugfix
git checkout -b fix/bug-description
```

### 4. Make Your Changes

* Write clean, readable code
* Follow existing code style
* Add tests for new features
* Update documentation as needed
* Keep commits atomic and well-described

### 5. Test Your Changes

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### 6. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(cart): resolve item duplication issue"
git commit -m "docs(readme): update installation instructions"
```

**Types:**
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that don't affect code meaning (formatting, etc.)
* `refactor`: Code change that neither fixes a bug nor adds a feature
* `perf`: Performance improvements
* `test`: Adding missing tests
* `chore`: Changes to build process or auxiliary tools

### 7. Push & Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

## 📝 Styleguides

### TypeScript Styleguide

* Use TypeScript for all new files
* Avoid `any` types - use proper types or `unknown`
* Use interfaces for object shapes
* Use type aliases for unions and complex types
* Export types that are used across files
* Add JSDoc comments for complex functions

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

async function getUser(id: string): Promise<User | null> {
  // Implementation
}

// ❌ Bad
async function getUser(id: any): Promise<any> {
  // Implementation
}
```

### React Styleguide

* Use functional components with hooks
* Use named exports for components
* Keep components small and focused
* Extract custom hooks for reusable logic
* Use TypeScript for props
* Avoid inline styles - use Tailwind classes

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
    >
      {label}
    </button>
  );
}

// ❌ Bad
export default function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

```bash
# ✅ Good
feat(auth): add password reset functionality

Implement password reset flow with email verification.
Users can now request a password reset link via email.

Closes #123

# ❌ Bad
Added some auth stuff
```

### Database Migrations

* Use descriptive migration names
* Test migrations both up and down
* Never modify existing migrations
* Include seed data for new features

```bash
# Create a new migration
pnpm prisma migrate dev --name add_user_preferences

# Apply migrations
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

## 🧪 Testing Guidelines

### Unit Tests

* Test business logic thoroughly
* Mock external dependencies
* Use descriptive test names
* Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('Cart Service', () => {
  it('should add item to cart successfully', () => {
    // Arrange
    const cart = new Cart();
    const item = { id: '1', name: 'Butter Chicken', price: 15.99 };

    // Act
    cart.addItem(item);

    // Assert
    expect(cart.items).toHaveLength(1);
    expect(cart.total).toBe(15.99);
  });
});
```

### Integration Tests

* Test API endpoints
* Test database operations
* Use test database
* Clean up after tests

### E2E Tests

* Test critical user flows
* Use Playwright for browser automation
* Test on multiple browsers
* Keep tests independent

## 📚 Documentation

* Update README.md for new features
* Add JSDoc comments for complex functions
* Update API documentation
* Include code examples
* Keep documentation up-to-date

## 🔍 Code Review Process

All submissions require review. We use GitHub pull requests for this purpose:

1. **Automated Checks**: CI/CD will run tests, linting, and type checking
2. **Code Review**: At least one maintainer must approve
3. **Address Feedback**: Make requested changes
4. **Merge**: Once approved, a maintainer will merge your PR

### Review Criteria

* Code quality and readability
* Test coverage
* Performance implications
* Security considerations
* Documentation completeness
* Backwards compatibility

## 🏆 Recognition

Contributors who make significant contributions will be:
* Added to the Contributors section
* Mentioned in release notes
* Considered for maintainer role

## 📞 Need Help?

* **Questions**: Open a GitHub Discussion
* **Bugs**: Open a GitHub Issue
* **Security**: Email techbantu@gmail.com

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to GharSe! 🙏

