"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Eye, EyeOff, Sparkles, Scale, ShieldCheck, Briefcase } from "lucide-react";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    // If forced look direction is provided, use that instead of mouse tracking
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    // If forced look direction is provided, use that instead of mouse tracking
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150 border border-slate-900/10"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

interface AnimatedCharactersLoginPageProps {
  loginId: string;
  setLoginId: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loginError: string;
  isLoggingIn: boolean;
  onLogin: (e: React.FormEvent) => void;
}

export function AnimatedCharactersLoginPage({
  loginId,
  setLoginId,
  password,
  setPassword,
  loginError,
  isLoggingIn,
  onLogin
}: AnimatedCharactersLoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking effect for purple character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Blinking effect for black character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Looking at each other animation when typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Purple sneaky peeking animation when typing password and it's visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      {/* Left Content Section with Legal/Attorney Styled Characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-12 text-white overflow-hidden border-r border-slate-800">
        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-500/30">
              <Scale className="size-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                LEGAL SUCCESS INDIA
              </span>
              <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-wider -mt-1">
                Trademark Lead Portal
              </span>
            </div>
          </div>
        </div>

        {/* Animation Stage */}
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            
            {/* Purple Tall Advocate (Supreme Court Robes) */}
            <div 
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#3b2c85', // Deep purple-blue robe color
                borderRadius: '16px 16px 0 0',
                zIndex: 1,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : (isTyping || (password.length > 0 && !showPassword))
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Black Blazer / Robe Collar */}
              <div className="absolute top-[68px] inset-x-2 bottom-0 bg-neutral-950 rounded-t-xl z-0 border-t border-slate-800">
                {/* V-neck showing white shirt */}
                <div className="w-[36px] h-[40px] bg-white mx-auto clip-path-v-neck" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
              </div>

              {/* Advocate White Collar Bands */}
              <div 
                className="absolute flex flex-col items-center z-10 transition-all duration-700"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: (password.length > 0 && showPassword) ? `${66}px` : isLookingAtEachOther ? `${90}px` : `${72 + purplePos.faceY}px`,
                }}
              >
                <div className="w-14 h-[6px] bg-white rounded-sm shadow-md" />
                <div className="flex gap-[4px] mt-[1px]">
                  <div className="w-[8px] h-[34px] bg-white rounded-b-sm shadow-md" />
                  <div className="w-[8px] h-[34px] bg-white rounded-b-sm shadow-md" />
                </div>
              </div>

              {/* Eyes */}
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out z-10"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={20} 
                  pupilSize={8} 
                  maxDistance={6} 
                  eyeColor="white" 
                  pupilColor="#1a1a1a" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall 
                  size={20} 
                  pupilSize={8} 
                  maxDistance={6} 
                  eyeColor="white" 
                  pupilColor="#1a1a1a" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>

              {/* Tiny Gavel Icon Logo on Coat */}
              <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 opacity-25">
                <Scale className="size-16 text-white" />
              </div>
            </div>

            {/* Black Tall Judge Character */}
            <div 
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#1c1c1e', // Elegant jet black
                borderRadius: '12px 12px 0 0',
                zIndex: 2,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || (password.length > 0 && !showPassword))
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* White Shirt Collar & Advocate Bands */}
              <div 
                className="absolute flex flex-col items-center z-10 transition-all duration-700"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: (password.length > 0 && showPassword) ? `${55}px` : isLookingAtEachOther ? `${32}px` : `${60 + blackPos.faceY}px`,
                }}
              >
                <div className="w-10 h-[5px] bg-white rounded-sm shadow-md" />
                <div className="flex gap-[3px] mt-[1px]">
                  <div className="w-[6px] h-[26px] bg-white rounded-b-sm shadow-md" />
                  <div className="w-[6px] h-[26px] bg-white rounded-b-sm shadow-md" />
                </div>
              </div>

              {/* Eyes */}
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out z-10"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>

              {/* Wooden Gavel on Judge Side */}
              <div className="absolute bottom-[35px] right-[8px] w-[26px] h-[45px] flex flex-col items-center rotate-[-15deg] z-20 opacity-90 drop-shadow-md">
                <div className="w-[20px] h-[11px] bg-amber-800 rounded-sm border border-amber-950" />
                <div className="w-[4px] h-[34px] bg-amber-600 border border-amber-950 -mt-[1px] rounded-b-full" />
              </div>
            </div>

            {/* Orange Advocate Character with Legal Spectacles */}
            <div 
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#e67e22', // Legal orange coat
                borderRadius: '120px 120px 0 0',
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Advocate Bands */}
              <div 
                className="absolute flex flex-col items-center z-10 transition-all duration-700"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: (password.length > 0 && showPassword) ? `${110}px` : `${115 + orangePos.faceY}px`,
                }}
              >
                <div className="w-10 h-[5px] bg-white rounded-sm" />
                <div className="flex gap-[3px] mt-[1px]">
                  <div className="w-[5px] h-[22px] bg-white rounded-b-sm" />
                  <div className="w-[5px] h-[22px] bg-white rounded-b-sm" />
                </div>
              </div>

              {/* Pupils */}
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out z-10"
                style={{
                  left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil size={13} maxDistance={5} pupilColor="#111111" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={13} maxDistance={5} pupilColor="#111111" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>

              {/* Wireframe Gold Attorney Spectacles */}
              <div 
                className="absolute flex items-center gap-[10px] z-20 pointer-events-none transition-all duration-200"
                style={{
                  left: (password.length > 0 && showPassword) ? `${44}px` : `${76 + (orangePos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${78}px` : `${83 + (orangePos.faceY || 0)}px`,
                }}
              >
                <div className="w-[24px] h-[24px] rounded-full border-2 border-amber-400 bg-transparent" />
                <div className="w-[12px] h-[2px] bg-amber-400 -mt-2" />
                <div className="w-[24px] h-[24px] rounded-full border-2 border-amber-400 bg-transparent" />
              </div>
            </div>

            {/* Yellow Advocate Character holding India Trademark Law Book */}
            <div 
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#cca010', // Golden corporate amber
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Advocate Bands */}
              <div 
                className="absolute flex flex-col items-center z-10 transition-all duration-700"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: (password.length > 0 && showPassword) ? `${60}px` : `${65 + yellowPos.faceY}px`,
                }}
              >
                <div className="w-12 h-[5px] bg-white rounded-sm" />
                <div className="flex gap-[3px] mt-[1px]">
                  <div className="w-[6px] h-[24px] bg-white rounded-b-sm" />
                  <div className="w-[6px] h-[24px] bg-white rounded-b-sm" />
                </div>
              </div>

              {/* Pupils */}
              <div 
                className="absolute flex gap-6 transition-all duration-200 ease-out z-10"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={13} maxDistance={5} pupilColor="#111111" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={13} maxDistance={5} pupilColor="#111111" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>

              {/* Horizontal line for mouth */}
              <div 
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />

              {/* Indian Trademark Law Book */}
              <div 
                className="absolute bottom-[20px] right-[8px] w-[54px] h-[72px] bg-rose-800 rounded-md border-l-4 border-amber-400 shadow-xl flex flex-col items-center justify-center rotate-[10deg] z-20 border border-rose-950 transition-all duration-300 hover:scale-105"
                title="Indian Trademark Act"
              >
                <div className="text-[8px] font-extrabold text-amber-300 tracking-wider">TM LAW</div>
                <div className="w-8 h-[1px] bg-amber-400/30 my-1" />
                <span className="text-[6px] font-bold text-white/90 uppercase tracking-widest">INDIA</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-20 flex items-center gap-6 text-xs text-indigo-300/80">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> SECURE GATEWAY
          </span>
          <span>•</span>
          <span>© 2026 Legal Success India</span>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Login Section */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile Header / Logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-2 mb-8 text-center">
            <div className="size-12 rounded-2xl bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Scale className="size-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
              LEGAL SUCCESS INDIA
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Trademark Lead Portal
            </p>
          </div>

          {/* Title Header */}
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Advocate Login
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Please sign in to access your trademark leads queue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={onLogin} className="space-y-6">
            {loginError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm rounded-xl border border-rose-200 dark:border-rose-900/30 animate-pulse">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="loginId" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Login ID
              </Label>
              <div className="relative">
                <Input
                  id="loginId"
                  type="text"
                  placeholder="e.g., admin or your_id"
                  value={loginId}
                  autoComplete="off"
                  onChange={(e) => setLoginId(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  disabled={isLoggingIn}
                  required
                  className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-indigo-500 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                  className="h-12 pr-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-indigo-500 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Remember my session
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10 transition-all hover:translate-y-[-1px] active:translate-y-[1px]" 
              disabled={isLoggingIn || !loginId.trim() || !password.trim()}
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Lead Desk"}
            </Button>
          </form>

          {/* Social Sign In Accent */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-100 dark:bg-slate-900 -z-10" />
            <span className="px-3 text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-950">
              Secured Desk
            </span>
          </div>

          <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-200/50 dark:border-slate-800/50">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Default Admin Credentials:<br/>
              ID: <strong className="text-indigo-600 dark:text-indigo-400">admin</strong> • Password: <strong className="text-indigo-600 dark:text-indigo-400">admin</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
