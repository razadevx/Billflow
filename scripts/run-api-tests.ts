import assert from "assert";

async function main() {
  const baseUrl = "http://localhost:3000/api";
  
  const reqHeaders = { 
    "Content-Type": "application/json",
    "Origin": "https://billflow.xinrlabs.com",
    "Referer": "https://billflow.xinrlabs.com/",
    "User-Agent": "Node-Test-Script"
  };

  console.log("Registering a new company and user...");
  const email = `api-tester-${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({
      companyName: "API Test Company",
      userName: "API Tester",
      email: email,
      password: "Password123!"
    })
  });
  
  if (!registerRes.ok) {
    const errorBody = await registerRes.text();
    throw new Error(`Registration failed: ${registerRes.status} ${errorBody}`);
  }

  console.log("Signing in to get session cookie...");
  const signInRes = await fetch(`${baseUrl}/auth/sign-in/email`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({
      email,
      password: "Password123!"
    })
  });

  if (!signInRes.ok) {
    const errBody = await signInRes.text();
    throw new Error(`Sign-in failed: ${signInRes.status} ${errBody}`);
  }

  const cookies = signInRes.headers.get("set-cookie");
  if (!cookies) throw new Error("No cookies returned from sign-in");
  console.log("Cookies received:", cookies);

  // Extract exact cookie
  const sessionTokenMatch = cookies.match(/([a-zA-Z0-9_-]*better-auth\.session_token)=([^;]+)/);
  if (!sessionTokenMatch) throw new Error("No session token cookie found");
  
  const cookieName = sessionTokenMatch[1];
  const token = sessionTokenMatch[2];
  
  const headers = {
    "Cookie": `${cookieName}=${token}`,
    "Content-Type": "application/json",
    "Origin": "https://billflow.xinrlabs.com",
    "Referer": "https://billflow.xinrlabs.com/",
    "User-Agent": "Node-Test-Script"
  };

  const adminBaseUrl = `${baseUrl}/v1/administration`;

  console.log("Testing GET /company...");
  const getCompany = await fetch(`${adminBaseUrl}/company`, { headers, redirect: 'manual' });
  if (getCompany.status === 307 || getCompany.status === 308 || getCompany.status === 302) {
    throw new Error(`Redirected to ${getCompany.headers.get('location')} - authentication failed`);
  }
  assert.strictEqual(getCompany.status, 200, "GET /company should return 200");
  const companyData = await getCompany.json();
  console.log("Company:", companyData.name);

  console.log("Testing PUT /company...");
  const putCompany = await fetch(`${adminBaseUrl}/company`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ name: "Updated Company Name" })
  });
  assert.strictEqual(putCompany.status, 200, "PUT /company should return 200");
  const updatedCompany = await putCompany.json();
  assert.strictEqual(updatedCompany.name, "Updated Company Name");

  console.log("Testing GET /settings...");
  const getSettings = await fetch(`${adminBaseUrl}/settings`, { headers });
  assert.strictEqual(getSettings.status, 200, "GET /settings should return 200");

  console.log("Testing PUT /settings...");
  const putSettings = await fetch(`${adminBaseUrl}/settings`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ key: "TEST_KEY", value: "TEST_VALUE" })
  });
  assert.strictEqual(putSettings.status, 200, "PUT /settings should return 200");

  console.log("Testing GET /users...");
  const getUsers = await fetch(`${adminBaseUrl}/users`, { headers });
  assert.strictEqual(getUsers.status, 200, "GET /users should return 200");

  console.log("Testing PUT /users...");
  // update the user role to MANAGER
  const usersList = await getUsers.json();
  const userId = usersList[0].id;
  const putUser = await fetch(`${adminBaseUrl}/users`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ userId, role: "OWNER" })
  });
  assert.strictEqual(putUser.status, 200, "PUT /users should return 200");

  console.log("Testing GET /sequences...");
  const getSeq = await fetch(`${adminBaseUrl}/sequences`, { headers });
  assert.strictEqual(getSeq.status, 200, "GET /sequences should return 200");

  console.log("Testing GET /invitations...");
  const getInvites = await fetch(`${adminBaseUrl}/invitations`, { headers });
  assert.strictEqual(getInvites.status, 200, "GET /invitations should return 200");

  console.log("Testing POST /invitations...");
  const postInvite = await fetch(`${adminBaseUrl}/invitations`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: `newuser-${Date.now()}@test.com`, role: "STAFF" })
  });
  assert.ok(postInvite.status === 200 || postInvite.status === 201, `POST /invitations should return 200 or 201 (got ${postInvite.status})`);
  const inviteData = await postInvite.json();

  console.log("Testing DELETE /invitations...");
  const deleteInvite = await fetch(`${adminBaseUrl}/invitations/${inviteData.id}`, {
    method: "DELETE",
    headers
  });
  assert.strictEqual(deleteInvite.status, 200, "DELETE /invitations should return 200");

  console.log("All API endpoints tested successfully!");
}

main().then(() => process.exit(0)).catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
