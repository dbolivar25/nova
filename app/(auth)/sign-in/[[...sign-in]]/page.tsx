import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary hover:bg-primary/90 text-primary-foreground",
            card: "bg-card",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: 
              "bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border",
            formFieldLabel: "text-foreground",
            formFieldInput: 
              "bg-background border-input text-foreground",
            footerActionLink: 
              "text-primary hover:text-primary/80"
          }
        }}
      />
    </div>
  );
}