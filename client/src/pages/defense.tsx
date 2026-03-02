// import { useState, useEffect } from "react";
// import { useUserTools, useConfirmDefense } from "@/hooks/use-tools";
// import { useGameState } from "@/hooks/use-game";
// import { useToast } from "@/hooks/use-toast";
// import { motion, AnimatePresence } from "framer-motion";
// import { Shield, Crosshair } from "lucide-react";
// import { UserToolWithTool } from "@shared/schema";


// export default function Defense() {
//   const { data: userTools = [], isLoading } = useUserTools();
//   const { data: gameState } = useGameState();
//   const { mutateAsync: confirmDefense } = useConfirmDefense();
//   const { toast } = useToast();

//   const [selectedTool, setSelectedTool] = useState<number | null>(null);
//   const [initialLayout, setInitialLayout] = useState<Record<number, number | null>>({});
//   const [draftLayout, setDraftLayout] = useState<Record<number, number | null>>({});

//   const penaltyWillApply = Object.keys(initialLayout).some(idStr => {
//     const id = Number(idStr);
//     const original = initialLayout[id];
//     const current = draftLayout[id];

//     return original !== null && original !== current;
//   });
//   // Snapshot + Draft initialization
//   useEffect(() => {
//     if (userTools.length > 0) {
//       const snapshot: Record<number, number | null> = {};
//       userTools.forEach(t => {
//         snapshot[t.id] = t.layer;
//       });

//       setInitialLayout(snapshot);
//       setDraftLayout(snapshot);
//     }
//   }, [userTools]);

  

//   const isPlacementPhase =
//     gameState?.phase === "placement" ||
//     gameState?.phase?.startsWith("attack");

//   // Place tool in draft only
//   const handlePlace = (layer: number) => {
//     if (!selectedTool) return;

//     setDraftLayout(prev => ({
//       ...prev,
//       [selectedTool]: layer
//     }));
//   };

//   const handleReturnToArsenal = () => {
//     if (!selectedTool) return;

//     setDraftLayout(prev => ({
//       ...prev,
//       [selectedTool]: null
//     }));
//   };

//   // Confirm entire grid
//   const handleConfirm = async () => {
//     try {
//       const result = await confirmDefense(draftLayout);

//       if (result.penaltyApplied) {
//         toast({
//           title: "Penalty Applied",
//           description: "20 credits deducted for repositioning tools.",
//         });
//       }

//       toast({
//         title: "Deployment Confirmed",
//         description: "Defense grid updated successfully.",
//       });

//       setInitialLayout({ ...draftLayout });
//       setSelectedTool(null);

//     } catch (err: any) {
//       toast({
//         variant: "destructive",
//         title: "Deployment Failed",
//         description: err.message,
//       });
//     }
//   };

//   const unplacedTools = userTools.filter(ut => draftLayout[ut.id] === null);
//   const layer1 = userTools.filter(ut => draftLayout[ut.id] === 1);
//   const layer2 = userTools.filter(ut => draftLayout[ut.id] === 2);
//   const layer3 = userTools.filter(ut => draftLayout[ut.id] === 3);

//   const renderToolCard = (ut: UserToolWithTool) => {
//     const isSelected = selectedTool === ut.id;

//     return (
//       <div
//         key={ut.id}
//         onClick={() =>
//           isPlacementPhase &&
//           setSelectedTool(isSelected ? null : ut.id)
//         }
//         className={`p-3 rounded-md font-mono text-sm cursor-pointer transition-all border ${
//           isSelected
//             ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(0,255,255,0.3)]"
//             : "bg-background border-border hover:border-primary/50"
//         } ${!isPlacementPhase ? "opacity-75 cursor-not-allowed" : ""}`}
//       >
//         <div className="flex justify-between items-center">
//           <span className="font-bold text-foreground truncate">
//             {ut.tool.name}
//           </span>
//           <span className="text-accent flex items-center">
//             <Shield className="w-3 h-3 mr-1" />
//             {ut.tool.strength}
//           </span>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center">
//             <Crosshair className="w-6 h-6 mr-3 text-primary" />
//             Defense Grid
//           </h2>
//           <p className="text-muted-foreground font-mono mt-2">
//             Rearrange freely. Penalty applies only when confirming changes.
//           </p>
//         </div>

//         {isPlacementPhase && (
//           <button
//             onClick={handleConfirm}
//             className={`cyber-button px-6 ${
//               penaltyWillApply
//                 ? "bg-destructive text-white border border-destructive"
//                 : "cyber-button-primary"
//             }`}
//           >
//             {penaltyWillApply
//               ? "Confirm Deployment (20 Credit Penalty)"
//               : "Confirm Deployment"}
//           </button>
//         )}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

//         {/* Arsenal */}
//         <div className="cyber-panel p-4 lg:col-span-1 flex flex-col h-[600px]">
//           <h3 className="text-sm font-display uppercase text-muted-foreground mb-4 border-b border-border pb-2">
//             Available Arsenal ({unplacedTools.length})
//           </h3>

//           {selectedTool !== null && draftLayout[selectedTool] !== null && (
//             <button
//               onClick={handleReturnToArsenal}
//               className="mb-4 py-2 border border-primary/50 text-primary text-[10px] font-bold uppercase hover:bg-primary hover:text-primary-foreground transition-all"
//             >
//               Return to Arsenal
//             </button>
//           )}

//           <div className="flex-1 overflow-y-auto space-y-3 pr-2">
//             <AnimatePresence>
//               {unplacedTools.map(ut => (
//                 <motion.div
//                   key={ut.id}
//                   layout
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                 >
//                   {renderToolCard(ut)}
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>
//         </div>

//         {/* Layers */}
//         {[1, 2, 3].map(layer => {
//           const layerTools =
//             layer === 1 ? layer1 :
//             layer === 2 ? layer2 :
//             layer3;

//           return (
//             <div
//               key={layer}
//               className="cyber-panel p-4 flex flex-col h-[600px]"
//             >
//               <div className="text-center mb-4">
//                 <h3 className="text-lg font-display font-bold">
//                   Layer {layer}
//                 </h3>
//               </div>

//               {selectedTool && (
//                 <button
//                   onClick={() => handlePlace(layer)}
//                   className="cyber-button cyber-button-primary text-xs py-2 w-full mb-4 animate-pulse"
//                 >
//                   Deploy Here
//                 </button>
//               )}

//               <div className="flex-1 overflow-y-auto space-y-3 bg-black/20 rounded-md p-2 border border-white/5">
//                 {layerTools.map(ut => renderToolCard(ut))}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useUserTools, useConfirmDefense } from "@/hooks/use-tools";
import { useGameState } from "@/hooks/use-game";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Crosshair } from "lucide-react";
import { UserToolWithTool } from "@shared/schema";

export default function Defense() {
  const { data: userTools = [], isLoading } = useUserTools();
  const { data: gameState } = useGameState();
  const { mutateAsync: confirmDefense } = useConfirmDefense();
  const { toast } = useToast();

  const [selectedTool, setSelectedTool] = useState<number | null>(null);
  const [initialLayout, setInitialLayout] = useState<Record<number, number | null>>({});
  const [draftLayout, setDraftLayout] = useState<Record<number, number | null>>({});

  /* Snapshot + Draft initialization */
  useEffect(() => {
    if (userTools.length > 0) {
      const snapshot: Record<number, number | null> = {};
      userTools.forEach(t => {
        snapshot[t.id] = t.layer;
      });

      setInitialLayout(snapshot);
      setDraftLayout(snapshot);
    }
  }, [userTools]);

  const isPlacementPhase =
    gameState?.phase === "placement" ||
    gameState?.phase?.startsWith("attack");

  /* Place tool in draft */
  const handlePlace = (layer: number) => {
    if (!selectedTool) return;

    setDraftLayout(prev => ({
      ...prev,
      [selectedTool]: layer
    }));
  };

  const handleReturnToArsenal = () => {
    if (!selectedTool) return;

    setDraftLayout(prev => ({
      ...prev,
      [selectedTool]: null
    }));
  };

  /* Confirm grid */
  const handleConfirm = async () => {
    try {
      await confirmDefense(draftLayout);

      toast({
        title: "Deployment Confirmed",
        description: "Defense grid updated successfully.",
      });

      setInitialLayout({ ...draftLayout });
      setSelectedTool(null);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Deployment Failed",
        description: err.message,
      });
    }
  };

  const unplacedTools = userTools.filter(
  ut => draftLayout[ut.id] === null || draftLayout[ut.id] === undefined
);
  const layer1 = userTools.filter(ut => draftLayout[ut.id] === 1);
  const layer2 = userTools.filter(ut => draftLayout[ut.id] === 2);
  const layer3 = userTools.filter(ut => draftLayout[ut.id] === 3);

  const renderToolCard = (ut: UserToolWithTool) => {
    const isSelected = selectedTool === ut.id;

    return (
      <div
        key={ut.id}
        onClick={() =>
          isPlacementPhase &&
          setSelectedTool(isSelected ? null : ut.id)
        }
        className={`p-3 rounded-md font-mono text-sm cursor-pointer transition-all border ${
          isSelected
            ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            : "bg-background border-border hover:border-primary/50"
        } ${!isPlacementPhase ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        <div className="flex justify-between items-center">
          <span className="font-bold text-foreground truncate">
            {ut.tool.name}
          </span>
          <span className="text-accent flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            {ut.current_strength}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center">
            <Crosshair className="w-6 h-6 mr-3 text-primary" />
            Defense Grid
          </h2>
          <p className="text-muted-foreground font-mono mt-2">
            Rearrange tools freely before the next attack.
          </p>
        </div>

        {isPlacementPhase && (
          <button
            onClick={handleConfirm}
            className="cyber-button cyber-button-primary px-6"
          >
            Confirm Deployment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Arsenal */}
        <div className="cyber-panel p-4 lg:col-span-1 flex flex-col h-[600px]">
          <h3 className="text-sm font-display uppercase text-muted-foreground mb-4 border-b border-border pb-2">
            Available Arsenal ({unplacedTools.length})
          </h3>

          {selectedTool !== null && draftLayout[selectedTool] !== null && (
            <button
              onClick={handleReturnToArsenal}
              className="mb-4 py-2 border border-primary/50 text-primary text-[10px] font-bold uppercase hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Return to Arsenal
            </button>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            <AnimatePresence>
              {unplacedTools.map(ut => (
                <motion.div
                  key={ut.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {renderToolCard(ut)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Layers */}
        {[1, 2, 3].map(layer => {
          const layerTools =
            layer === 1 ? layer1 :
            layer === 2 ? layer2 :
            layer3;

          return (
            <div
              key={layer}
              className="cyber-panel p-4 flex flex-col h-[600px]"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-display font-bold">
                  Layer {layer}
                </h3>
              </div>

              {selectedTool && (
                <button
                  onClick={() => handlePlace(layer)}
                  className="cyber-button cyber-button-primary text-xs py-2 w-full mb-4 animate-pulse"
                >
                  Deploy Here
                </button>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 bg-black/20 rounded-md p-2 border border-white/5">
                {layerTools.map(ut => renderToolCard(ut))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}