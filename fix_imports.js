const fs = require('fs');

const files = [
  'src/app/api/customers/[id]/metrics/route.ts',
  'src/app/api/customers/[id]/timeline/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/customers/route.ts'
];

const oldStr = 'const getMockContext = () => new RequestContext("mock-company-id", "mock-user-id");';
const newStr = `const getMockContext = (): RequestContext => ({ companyId: "mock-company-id", userId: "mock-user-id", role: "ADMIN" as any, permissions: [], requestId: "req-1", timestamp: new Date() });`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
  }
});

const searchFile = 'src/app/api/search/route.ts';
if (fs.existsSync(searchFile)) {
  let content = fs.readFileSync(searchFile, 'utf8');
  content = content.replace(
    'const mockContext = new RequestContext("mock-company-id", "mock-user-id");', 
    'const mockContext: RequestContext = { companyId: "mock-company-id", userId: "mock-user-id", role: "ADMIN" as any, permissions: [], requestId: "req-1", timestamp: new Date() };'
  );
  fs.writeFileSync(searchFile, content);
}

// Add success/failure to Result.ts
const resultFile = 'src/server/core/Result.ts';
if (fs.existsSync(resultFile)) {
  let content = fs.readFileSync(resultFile, 'utf8');
  if (!content.includes('export const success')) {
    content += `\nexport const success = <T, E = Error>(value: T): Result<T, E> => new Success(value);\n`;
    content += `export const failure = <T, E = Error>(error: E): Result<T, E> => new Failure(error);\n`;
    fs.writeFileSync(resultFile, content);
  }
}
