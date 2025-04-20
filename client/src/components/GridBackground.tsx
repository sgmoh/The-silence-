import { motion } from "framer-motion";

export default function GridBackground() {
  return (
    <motion.div 
      className="grid-background absolute inset-0 z-0"
      animate={{
        backgroundPosition: ["0px 0px", "50px 50px"]
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}
