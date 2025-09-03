import { LoginForm } from "./login-form"


const HomeRoom = () => {
    return (
        <div className="grid dark text-accent-foreground bg-[var(--background)] place-items-center min-h-screen h-full p-4 w-full">
            <LoginForm />
        </div>
    )
}

export default HomeRoom