---
marp: true
theme: wctc
style: |
  section {
    font-size: 20px;
    max-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: var(--color-background);
    border-radius: 5px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
---
![WCTC Logo](https://www.wctc.edu/Files/waukesha_logo.svg)

# .Net Database Programming (156-101)
## Week 2 Curriculum
*Instructor: Mark McArthey*

---

# Version Control with Git, GitHub, and kdiff3
### `Git` ready to `commit` to learning!

---

## What is Version Control?
- **Definition**: Version control is a system that records changes to a file or set of files over time so that you can recall specific versions later.
- **Importance**: Helps in tracking changes, collaborating with others, and maintaining a history of the project.

---

## Introduction to Git
- **What is Git?**: Git is a distributed version control system designed to handle everything from small to very large projects with speed and efficiency.
- **Why use Git?**: 
  - Distributed system
  - Performance
  - Security
  - Flexibility

---

## GitHub Basics

- **What is GitHub?:** GitHub is a web-based platform used for version control using Git. It hosts your Git repositories and provides tools for collaboration.
- **Creating a GitHub Account:** Sign up at [github.com](https://www.github.com).
- **Creating a Repository:** Click on the "New" button on your GitHub dashboard to create a new repository.

--- 

## Setting Up Git
1. **Install Git**: Download and install Git from [git-scm.com](https://git-scm.com/).
2. **Configure Git**: Set up your Git username and email.
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

---

## Basic Git Commands
- **git init**: Initialize a new Git repository
- **git clone**: Clone an existing repository
- **git status**: Check the status of your files in the working directory
- **git add**: Add files to the staging area
- **git commit**: Commit changes to the repository
- **git push**: Push changes to a remote repository
- **git pull**: Pull changes from a remote repository
- **git branch**: List, create, or delete branches
- **git checkout**: Switch branches or restore working tree files

---
<style scoped>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#1</div>
</style>
## Creating and Committing a Git Repository
### Step-by-Step Guide

1. **Navigate to your project directory:**
`cd /path/to/your/project`
2. **Initialize a new Git repository:**
`git init`
3. **Add your files to the staging area:**
`git add .`
4. **Commit your changes:**
`git commit -m "Initial commit"`

---
<style scoped>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#2</div>
</style>

## Creating and Committing a Git Repository
### Step-by-Step Guide

5. **Create a new repository on GitHub:**
    - Go to [GitHub](https://www.github.com) and log in.
    - Click on the "New" button to create a new repository.
    - Fill in the repository name and other details, then click "Create repository".
6. **Add the remote repository URL:**
`git remote add origin https://github.com/yourusername/your-repo.git`
7. **Push your changes to the remote repository:**
`git push -u origin master`
<div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#2</div>

---
<style scoped>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#1</div>
</style>

## Local vs Remote Repositories
### Local Repository
- **Definition**: A repository stored on your local machine.
- **Usage**: 
  - Allows you to work on your project offline.
  - Contains your working directory, staging area, and commit history.
- **Commands**:
  - `git init`: Initialize a local repository.
  - `git commit`: Commit changes to the local repository.

---
<style scoped>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#2</div>
</style>

## Local vs Remote Repositories
### Remote Repository
- **Definition**: A repository hosted on a remote server (e.g., GitHub, GitLab).
- **Usage**: 
  - Facilitates collaboration with others.
  - Acts as a backup for your local repository.
  - Allows you to share your code with others.
- **Commands**:
  - `git remote add origin <url>`: Link your local repository to a remote repository.
  - `git push`: Push changes from your local repository to the remote repository.
  - `git pull`: Pull changes from the remote repository to your local repository.

---

## Cloning a Repository
- **Command:** `git clone <repository-url>`
- **Example:** `git clone https://github.com/yourusername/your-repo.git`

---

## Branching and Merging
- **Branching:** Allows you to create a separate line of development.
    - **Command:** `git branch <branch-name>`
    - **Switch Branch:** `git checkout <branch-name>`
- **Merging:** Combines changes from different branches.
    - **Command:** `git merge <branch-name>`
- **Why Branch?**: 
  - Work on new features without affecting the main codebase.
  - Experiment with new ideas safely.
  - Collaborate with others without conflicts.

---

## Visualizing Git Branching
<img src="https://i0.wp.com/digitalvarys.com/wp-content/uploads/2019/06/GIT-Branchand-its-Operations.png" alt="Git Branching" style="width: 60%; height: auto; display: block; margin: 0 auto;"></img>
- **Master Branch**: The main branch where the stable code resides.
- **Feature Branch**: A branch created to work on a new feature.

---

## Creating and Switching Branches
- **Create a Branch**: `git branch <branch-name>`
- **Switch to Branch**: `git checkout <branch-name>`
- **Example**:
    ```bash
    git branch feature-xyz
    git checkout feature-xyz
    ```

---

## Resolving Conflicts with kdiff3
- **Download and Install kdiff3:** kdiff3.sourceforge.net
- **Setup kdiff3 as the merge tool:**
    ```bash
    git config --global merge.tool kdiff3
    git config --global mergetool.kdiff3.path "/path/to/kdiff3"
    git config --global mergetool.kdiff3.trustExitCode false
    ```
- **merge.tool kdiff3**: Tells Git to use kdiff3 as the merge tool.
- **mergetool.kdiff3.path**: Specifies the path to the kdiff3 executable. Replace "/path/to/kdiff3" with the actual path where kdiff3 is installed on your system.
- **mergetool.kdiff3.trustExitCode false**: This tells Git not to automatically trust the exit code of kdiff3. You’ll confirm the merge in the terminal after resolving conflicts.
---

## Using kdiff3 to Resolve Conflicts
- **Understanding the kdiff3 Interface:**
  - kdiff3 displays three versions of the conflicting file:
    - **A** (left pane): The file in the branch you are merging into.
    - **B** (right pane): The file in the branch you are merging from.
    - **C** (bottom pane): The result of the merge, where you will resolve the conflicts.
  - The middle pane shows the original common ancestor of the two files.
 
- **Resolving the Conflict:**
  - Review the differences highlighted by kdiff3.
  - Manually merge the changes by selecting the appropriate lines or by editing the content directly in the bottom pane (C).
  - Save the resolved file using `File > Save` or the save icon.

---
## Triggering kdiff3 During a Merge Conflict
- When you encounter a merge conflict, Git will prompt you to resolve it.
- To launch kdiff3, use the `git mergetool` command.
- This command will open kdiff3, showing the conflicting files and allowing you to compare and merge them.

---
## Finalizing the Merge
- After resolving all conflicts and saving the merged file, close kdiff3.
- Confirm the merge by committing the resolved changes:
    ```bash
    git add <filename>
    git commit -m "Resolved merge conflicts in <filename>"
    ```
---

## Additional Resources
- **Official Git Documentation**: [git-scm.com/doc](https://git-scm.com/doc)
- **Pro Git Book**: [git-scm.com/book/en/v2](https://git-scm.com/book/en/v2)
- **GitHub Learning Lab**: [lab.github.com](https://lab.github.com/)
- **Atlassian Git Tutorials**: [atlassian.com/git/tutorials](https://www.atlassian.com/git/tutorials)
- **Codecademy Git Course**: [codecademy.com/learn/learn-git](https://www.codecademy.com/learn/learn-git)

---

## Summary
- **Version Control**: Essential for tracking changes and collaboration.
- **Git**: Powerful, distributed version control system.
- **GitHub**: Platform for hosting Git repositories and collaboration.
- **kdiff3**: Tool for resolving merge conflicts.
- **Practice**: Follow the step-by-step guide for the group project.

---

## Group Project
- **In-class Group Project:** Collaborate using GitHub to manage the codebase and track changes.

- **Download and Install kdiff3**: Before starting the group project, you should have downloaded and installed kdiff3, a software that helps in resolving merge conflicts. It can be downloaded from the [official kdiff3 website](http://kdiff3.sourceforge.net/). Follow the instructions on the website to install it on your machine.

- **Setup kdiff3 as the merge tool**: Before starting the group project, you should set up kdiff3 as your merge tool in Git. This can be done by adding the following configuration to the Git config file:
    ```bash
    git config --global merge.tool kdiff3
    git config --global mergetool.kdiff3.path "/path/to/kdiff3"
    git config --global mergetool.kdiff3.trustExitCode false
    ```

- **Verify git configuration:** Verify your git configuration with the following command:
`git config --global --list`

---
<style scoped>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#1</div>
</style>

## Step-by-Step Guide for Group Project

1. **Initialize a Git repository**: Start by initializing a Git repository in your project directory using the `git init` command.

2. **Work on the Main Branch**: Everyone will work directly on the main branch. No need to create separate branches.

3. **Make changes and commit**: Make changes to the code in your branch, and then commit these changes using the `git add` and `git commit` commands.

4. **Push changes to GitHub**: After committing your changes, push your branch to GitHub using the `git push` command.

5. **Pull and Merge Changes from Others**: Before you start working or before pushing new changes, pull the latest changes from the main branch with the `git pull` command.

---
<style scoped>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; color: gray;">#2</div>
</style>

## Step-by-Step Guide for Group Project

6. **Resolve conflicts with kdiff3**: If there are any merge conflicts, use kdiff3 to resolve these conflicts. After resolving conflicts, commit the resolved code using the `git add` and `git commit` commands.

7. **Push merged changes to GitHub**: After merging and resolving conflicts, push your branch to GitHub using the `git push` command.

8. **Review code**: Finally, review the code on GitHub, and discuss any issues or improvements.

Remember, the key to effective collaboration with Git and GitHub is communication. Communicate with your team about what changes you're making, when you're pushing and pulling changes, and when you're merging changes.

---
## Final Thoughts
- Remember, with great power comes great responsibility.
- Keep practicing and you'll `Git` better every day!

---