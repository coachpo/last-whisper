# Website Automated Test Case Generation Workflow

Depth-First Search (DFS) Execution Instructions

This document serves as an operational guide for the executor. The goal is to automatically discover functionalities, traverse all reachable paths from the website entry point without presupposed business knowledge, and automatically generate test cases based on the traversal process. The execution uses Playwright MCP for operations, Memory MCP for state storage, MCP-Shrimp Task Manager for task list management, and Sequential Thinking for execution logic control.

---

## I. Objectives

1.  Automatically traverse pages and functionalities starting from the website entry page.
2.  Automatically identify all executable actions on the current page (clickable, inputtable, submittable, switchable, etc.).
3.  Use Depth-First Search (DFS) strategy to explore all functional paths.
4.  Add newly discovered functionalities to the pending task list during traversal to continue deep exploration.
5.  Use Memory MCP to record visited page states to avoid duplicate traversal.
6.  Use MCP-Shrimp Task Manager to manage the task list execution order.
7.  Generate Playwright automated test cases and final test reports based on the paths.

---

## II. Core Execution Elements

| Name | Description | Tool |
| :--- | :--- | :--- |
| Page State (State) | Page URL, structure summary, context state, used for deduplication and avoiding repetitive traversal | Memory MCP |
| Action | Executable actions triggered by the executor on the page (click, input, submit, etc.) | Playwright MCP + MCP-Shrimp Task Manager |
| Test Path | A series of Actions arranged in chronological order, forming a complete business flow or test scenario | Sequential Thinking |
| Backtracking | Restoring to the previous state to continue traversing other branches after a test path ends or terminates | DFS (Depth-First Search Strategy) |

---

## III. Tool Collaboration

### Playwright MCP (Execute Web Operations)

Responsibilities:

-   Control browser instances (launch, close, contexts, pages)
-   Execute Actions (click, input, select, navigate, wait for page load)
-   Provide page information after executing an Action for constructing new States
-   Restore to a specific page state by replaying the Test Path during the backtracking phase

Outputs:

-   Execution results (Success/Failure/Exception)
-   Page information usable for assertions (URL, elements, text, visibility, etc.)

---

### Memory MCP (Record Page States)

Recorded Content:

-   URL
-   Page structure summary (interactive elements, titles, key area information)
-   Context data (login status, data count, etc.)
-   Unique State Identifier (StateID)

Usage:

-   Determine new vs. old states to avoid duplicate traversal
-   Provide reference records for backtracking restoration and path reproduction

---

### MCP-Shrimp Task Manager (Task Management)

Responsibilities:

-   Save Actions and their corresponding Test Paths
-   Manage the DFS pending task list
-   Stack structure: Last-In, First-Out (LIFO)
-   Dynamically add new Actions to the task stack when discovered during traversal

Usage:

-   Control the execution order of DFS (Depth-First Search)
-   Ensure every branch is traversed independently and completely

---

### Sequential Thinking (Execution Control & Decision Making)

Responsibilities:

-   Clarify current state, current path, and pending tasks
-   Identify executable actions and assess potential state changes from execution
-   Plan the next operation (continue deeper or terminate branch)

Usage:

-   Decide the next execution content for Playwright MCP
-   Trigger test case generation and the backtracking phase

## IV. DFS Traversal Execution Flow

### Initialization

1.  Launch the browser environment and open the homepage via Playwright MCP.
2.  Get page information using Playwright MCP, capture the initial state (State_0), and write to Memory MCP.
3.  Scan for executable Actions on the page using Playwright MCP.
4.  Add all scanned Actions to the MCP-Shrimp task stack (LIFO).

---

### DFS Main Loop (Until Task List is Empty)

1.  Pop an Action from the MCP-Shrimp task stack (Last-In, First-Out).
2.  Replay the complete path using Playwright MCP based on the Test Path corresponding to that Action, restoring to the pre-execution state.
3.  Execute the Action using Playwright MCP and wait for the page changes to stabilize.
4.  Capture the page state after Action execution using Playwright MCP to construct State_new.
5.  Submit State_new to Memory MCP to determine if it is a new state.

#### Branch Handling:

| Condition | Handling Method |
| :--- | :--- |
| State_new Not Recorded | Write to Memory MCP; use Playwright MCP to identify new Actions, add them to the MCP-Shrimp task queue, and continue deeper. |
| State_new Recorded | Treat as path end: record the current Test Path as a complete path available for test case generation. |

6.  Execute Backtracking: Use Sequential Thinking to determine the backtrack point, then replay the corresponding path via Playwright MCP to restore to the previous state.
7.  Get the next Action from the MCP-Shrimp task stack and continue the DFS loop.

---

## V. Test Case Generation Strategy

When a test path is completed or reaches a previously visited duplicate state, generate the corresponding test case. The test case is built based on the sequence of Actions in that Test Path, combined with the executable logic of Playwright MCP.

Test Case Content Includes:

-   Case Title
-   Preconditions (e.g., login role, environment configuration)
-   Operational Steps (Sequential description of Actions in the complete path)
-   Expected Behavior and Verification Points (Based on Playwright MCP verifiable content)

Conversion Rules:

-   Each Action in the Test Path is converted into a single executable operation instruction in Playwright.
-   Key page changes are recorded as assertion points, for example: URL, DOM structure, key text, element visibility.
-   The path is considered complete when it terminates or encounters a duplicate state, used for generating a full test case.

---

## VI. Flow Structure Example (Conceptual)

Entry Page
↓
Discover all Actions → Add to MCP-Shrimp Task Stack
↓
Pop Action → Execute Deeply via Playwright MCP
↓
New State Produced?
↓ ↓
Yes No
Record & Expand Generate Test Case based on Test Path
↓
Replay Path via Playwright MCP to Backtrack to Previous State
↓
Task Stack Empty?
↓ ↓
Yes No → Continue Execution
Traversal Complete

---

# VII. Deliverables

## 1. Playwright Automated Test Cases

Automatically generate Playwright test cases based on the complete Test Paths recorded during the DFS traversal process.

Content Requirements:

-   Convert DFS paths into Playwright test logic that can be executed stably.
-   Each path generates an independent test case file or an `it` block under a `describe`.
-   Includes:
    -   Basic environment initialization (browser, context, and page).
    -   Execute Actions in the order of the Test Path.
    -   Generate assertions using Playwright MCP, including:
        -   URL change validation.
        -   Page title change validation.
        -   Validation of key element visibility or attributes on the page.
        -   Validation of prompt messages or state changes.
-   File Naming Convention:
    `TC_001_Keyword_Sequence.test.ts`

Structure Example (Text, no code):

TestCase: TC_001
Title: User enters order list from homepage and creates an order
Steps:

1.  Open Homepage
2.  Click "Order Management"
3.  Click "New Order"
    Assertions:
    Page redirects to /order/create
    Show creation success prompt
