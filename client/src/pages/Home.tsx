import { motion } from "framer-motion";
import TokenForm from "@/components/TokenForm";
import Logo from "@/components/Logo";
import GridBackground from "@/components/GridBackground";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
      <GridBackground />
      
      <header className="w-full flex justify-center items-center py-8 z-10">
        <motion.div 
          className="w-32 md:w-40"
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <Logo />
        </motion.div>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center z-10 flex-grow">
        <motion.div 
          className="text-center mb-12"
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            Welcome to <span className="text-primary">-SilentSignal</span>
          </h1>
          <p className="text-sm md:text-base opacity-75 mt-2">
            Enter your Discord bot credentials below to get started
          </p>
        </motion.div>

        <TokenForm />
      </main>

      <footer className="w-full py-6 text-center text-muted-foreground text-sm z-10">
        <p>&copy; {new Date().getFullYear()} -SilentSignal. All rights reserved.</p>
      </footer>
    </div>
  );
}
