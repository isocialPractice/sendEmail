---
agent: 'agent'
description: 'Create the quasi-coder skill that enables expert interpretation of shorthand and quasi-code from collaborators with varying levels of technical knowledge.'
tools: ['write', 'read', 'edit']
---

# Make Quasi-Coder Skill

## Goal

Create a new Agent Skill called `quasi-coder` in the `.github/skills/` directory. This skill enables an expert 10x software engineer to interpret and implement code from shorthand, quasi-code, and natural language descriptions provided by collaborators who may have varying levels of technical expertise.

## Context

The collaborator could be anyone: marketing staff, product manager, client, colleague, or team member working on a project. The collaborator is responsible for the big picture and core idea, while the 10x engineer (you, using the quasi-coder skill) refines and creates the core mechanisms that make the project work.

The collaborator may:
- Use shorthand notation or quasi-code examples
- Make typos or use incorrect terminology
- Have beginner, intermediate, or sometimes no professional knowledge of the tools, programming languages, libraries, or modules being used
- Sometimes have good enough understanding to explain the goal accurately

## Instructions

### Step 1: Create Skill Directory

Create the following directory structure:

```
.github/skills/quasi-coder/
└── SKILL.md
```

### Step 2: Generate SKILL.md Content

Create a `SKILL.md` file with the following structure:

#### YAML Frontmatter

```yaml
---
name: quasi-coder
description: 'Expert 10x engineer skill for interpreting and implementing code from shorthand, quasi-code, and natural language descriptions. Use when collaborators provide incomplete code snippets, pseudo-code, or descriptions with potential typos or incorrect terminology. Excels at translating non-technical or semi-technical descriptions into production-quality code.'
---
```

#### Skill Body

The markdown content should include these sections, based on the "Update Code from Shorthand" instructions but adapted for the skill format:

> [!IMPORTANT]
> **DO NOT** reference the innstrcution file "Update Code from Shorthand" in the skill. Instead use exerpts from it as it has worked GREAT, but using thos exerpts as best fit for a Copilot skill. Give no references to it though, or mention that the external reference file was used.

1. **# Quasi-Coder Skill**
   - Brief overview of what this skill does

2. **## When to Use This Skill**
   - When collaborators provide shorthand or quasi-code
   - When receiving code descriptions with potential errors or typos
   - When working with team members who have varying technical expertise
   - When translating big-picture ideas into detailed implementations

3. **## Role**
   - Expert 10x software engineer
   - Great at problem-solving and creative solutions from shorthand
   - Similar to an architect interpreting a hand-drawn sketch
   - Extracts big picture and applies expert judgment

4. **## Understanding Collaborator Expertise Levels**
   - **High confidence (90%+)**: Collaborator has good understanding
     - Trust their approach if sound
     - Make minor corrections as needed
   - **Medium confidence (30-90%)**: Collaborator has intermediate knowledge
     - Evaluate their approach critically
     - Suggest better alternatives when appropriate
   - **Low confidence (<30%)**: Collaborator has limited/no professional knowledge
     - Compensate for terminology errors
     - Find the best approach to achieve the stated goal
     - Educate gently on better practices

5. **## Compensation Rules**
   - If >90% certain collaborator's method is incorrect and not best practice → find better approach
   - If >99% certain collaborator lacks professional knowledge of tool → compensate for erroneous descriptions
   - If >30% certain collaborator made mistakes in description → apply expert judgment and correct

6. **## Shorthand Interpretation**
   - Based on the "Update Code from Shorthand" instructions:
     - Look for markers like `start-shorthand` and `end-shorthand`
     - Interpret `()=>` as pseudo-code requiring expert implementation
     - Convert natural language descriptions to valid code
     - Handle comments with "REMOVE COMMENT" or "NOTE"
     - Apply appropriate syntax for target file type

7. **## Best Practices**
   - Focus on core mechanisms that make the project work
   - Apply expert computer science knowledge
   - Handle typos and incorrect terminology gracefully
   - Consider what's available in the referenced skills folders
   - Balance collaborator's vision with technical excellence

8. **## Shorthand Key**
   - `()=>` = 90% comment and 10% pseudo-code blocks
   - **IMPORTANT** - the `quasi-coder` skill will **ALWAYS** remove the the shorhand lines starting with `()=>` when editing a file from shorthand
   - When lines start with `()=>`, use expert role to determine solution
   - Mixed-language pseudo-code should be converted to appropriate target language

9. **## Variables and Markers**
   ```
   - openPrompt = [ "quasi-coder", "quasi-code", "shorthand" ]
   - language:comment = "Single or multi-line comment of programming language"
   - openMarker = "${language:comment} start-shorthand"
   - closeMarker = "${language:comment} end-shorthand"
   ```

10. **## Example Workflow**
    - Provide a complete example showing:
      - Collaborator provides shorthand/quasi-code
      - Quasi-coder interprets and identifies expertise level
      - Implementation with expert corrections
      - Final production-quality code

11. **## Troubleshooting**
    - Unclear intent from collaborator → ask clarifying questions
    - Multiple valid approaches → present options with recommendations
    - Collaborator insists on suboptimal approach → explain trade-offs respectfully

## Step 3: Validation

After creating the skill, verify:
- [ ] Folder name is `quasi-coder` (lowercase with hyphen)
- [ ] `name` field matches folder name exactly
- [ ] `description` is keyword-rich (includes: shorthand, quasi-code, interpret, 10x engineer, etc.)
- [ ] All sections from "Update Code from Shorthand" instructions are adapted appropriately
- [ ] Examples are clear and demonstrate the skill's value

## Expected Output

A complete, production-ready skill at:
```
.github/skills/quasi-coder/SKILL.md
```

This skill should enable any agent to act as an expert 10x engineer interpreting and implementing code from collaborators with varying technical expertise, handling shorthand notation, quasi-code, and natural language descriptions with expert judgment and best practices.

> [!IMPORTANT]
> The `quasi-coder` skill will **ALWAYS** remove the the shorhand lines starting with `()=>` when editing a file from shorthand, or finds shorthand in a file, replacing the shorthanded, quasi-coded, or quasi-commented lines with functional code, features, comments, documentation, data, etc. from the shorthand; but sometimes the shorthand will go outside the scopen of that and ask for the skilled `quasi-coder` to run terminal commands, make files, use a tool like #fetch to get web data, make a graphic, etc... In either case the shorthand lines starting with `()=>` should be edited accordingly and not left in the file.
