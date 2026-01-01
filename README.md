Safe Bazaar AIOverviewSafe Bazaar AI is an innovative AI-powered marketplace designed to facilitate secure, transparent, and efficient transactions, particularly for underserved communities in Kenya. It leverages artificial intelligence for fraud detection, personalized product recommendations, secure payment processing, and community-driven trust features. Built with modern web technologies, this project aims to empower local buyers and sellers by reducing risks in online trading and promoting economic inclusion.Key Features:AI Fraud Detection: Real-time analysis to identify and prevent fraudulent activities.
Personalized Recommendations: Machine learning algorithms to suggest products based on user behavior.
Secure Transactions: Integrated payment gateways with encryption and verification.
User Profiles and Reviews: Community-based trust scores and feedback systems.
Mobile-Friendly Interface: Responsive design for accessibility on various devices.

This project is developed by Noel, inspired by the need for safer digital marketplaces in emerging economies. It's open for contributions, especially from Kenyan developers interested in AI and fintech.Project InfoURL: https://lovable.dev/projects/16b03f75-2077-45e0-ac63-ee8d6d36aa4d (Access the live demo or development environment here)GitHub Repository: [github.com/JustiNoel/safe-bazaar-ai] How Can I Edit This Code?There are several ways to edit and contribute to Safe Bazaar AI.Use LovableSimply visit the Lovable Project and start prompting or making changes directly in the platform.Changes made via Lovable will be committed automatically to this repo.Use Your Preferred IDEIf you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.The only requirement is having Node.js & npm installed - install with nvm.Follow these steps:sh

# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/JustiNoel/safe-bazaar-ai.git

# Step 2: Navigate to the project directory.
cd safe-bazaar-ai

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

Edit a File Directly in GitHubNavigate to the desired file(s) in the repository.
Click the "Edit" button (pencil icon) at the top right of the file view.
Make your changes and commit them.

Use GitHub CodespacesNavigate to the main page of your repository.
Click on the "Code" button (green button) near the top right.
Select the "Codespaces" tab.
Click on "New codespace" to launch a new Codespace environment.
Edit files directly within the Codespace and commit and push your changes once you're done.

What Technologies Are Used for This Project?This project is built with:Vite (for fast development and building)
TypeScript (for type-safe JavaScript)
React (for building user interfaces)
shadcn-ui (for accessible and customizable UI components)
Tailwind CSS (for utility-first styling)
Additional libraries: Potentially integrating AI/ML tools like TensorFlow.js or similar for client-side AI features (expand as needed)

How Can I Deploy This Project?Simply open Lovable and click on Share -> Publish to deploy to a production environment.For custom deployments, you can use platforms like Vercel, Netlify, or AWS by building the project with npm run build and uploading the output.Can I Connect a Custom Domain to My Lovable Project?Yes, you can!To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.Read more here: Setting up a custom domainContributingWe welcome contributions! If you're interested in improving Safe Bazaar AI, especially for Kenyan-specific features like integrating local payment systems (e.g., M-Pesa) or enhancing AI models for Swahili language support, please fork the repo and submit a pull request.For issues or suggestions, open a GitHub issue.LicenseThis project is licensed under the MIT License - see the LICENSE file for details.

How Can I Deploy This Project?This project is built with:Vite (for fast development and building)
TypeScript (for type-safe JavaScript)
React (for building user interfaces)

## Deploying the Backend (GitHub + GHCR)

This repository includes a GitHub Actions workflow that builds and pushes the backend Docker image to GitHub Container Registry (GHCR) on pushes to `main`.

What the workflow does:
- Builds the Docker image from the `backend` folder.
- Pushes `latest` and a commit-specific tag to `ghcr.io/${{ github.repository_owner }}/safe-bazaar-ai-backend`.

Required repository secrets / permissions:
- No extra secret is required if you use the default `GITHUB_TOKEN`, but you must ensure the token has `packages: write` permission for the workflow. The workflow sets that permission.

How to trigger the workflow:
1. Push code to the `main` branch.
2. Go to the repository Actions tab and watch the `Build and Push Backend Docker Image` run.

After the image is published, you can pull it with:

```bash
docker pull ghcr.io/<your-org-or-username>/safe-bazaar-ai-backend:latest
```

If you prefer using a personal access token (PAT) for other automation, create a token with `write:packages` scope and add it to the repository secrets as `GHCR_PAT`, then update the workflow to use that secret instead of `GITHUB_TOKEN`.

