const fs = require('fs');

const files = [
  'src/app/api/customers/[id]/metrics/route.ts',
  'src/app/api/customers/[id]/timeline/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/customers/route.ts',
  'src/app/api/search/route.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1) Replace NextResponse.json(successResponse(X), { status: Y }) -> successResponse(X, Y)
    content = content.replace(/return NextResponse\.json\(successResponse\((.*?)\),\s*\{\s*status:\s*(\d+)\s*\}\s*\);/g, 'return successResponse($1, $2);');
    // Replace NextResponse.json(successResponse(X)) -> successResponse(X)
    content = content.replace(/return NextResponse\.json\(successResponse\((.*?)\)\);/g, 'return successResponse($1);');
    
    // 2) Handle validation error cases
    content = content.replace(/return NextResponse\.json\(errorResponse\(\"(.*?)\",\s*\"(.*?)\",\s*parsed\.error\.format\(\)\),\s*\{\s*status:\s*(\d+)\s*\}\s*\);/g, 'return errorResponse("$1", "$2", $3, parsed.error.format());');

    // 3) Handle regular errorResponse cases
    content = content.replace(/return NextResponse\.json\(errorResponse\(\"(.*?)\",\s*\"(.*?)\"\),\s*\{\s*status:\s*(\d+)\s*\}\s*\);/g, 'return errorResponse("$1", "$2", $3);');

    fs.writeFileSync(file, content);
  }
});
