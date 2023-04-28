// import { useState, useCallback, useMemo } from "react";
// import { api } from "../utils/api";
// import {
//   DocumentPlusIcon,
//   PencilSquareIcon,
//   PlusIcon,
// } from "@heroicons/react/24/outline";
// import { PencilSquareIcon as SolidPencilSquareIcon } from "@heroicons/react/24/solid";
// import { DocumentPlusIcon as SolidDocumentPlusIcon } from "@heroicons/react/24/solid";
// import { IconButton } from "./IconButton";
// import { handleError } from "../utils/handleError";
// import clsx from "clsx";
// import ReactTextareaAutosize from "react-textarea-autosize";
// import { Fade } from "./animate/Fade";
// import {
//   closestCenter,
//   DndContext,
//   type DragEndEvent,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { getLexoRankIndexBetween } from "../utils";
// import { useAtom } from "jotai";
// import { newPrereqAtom, goalAtom } from "../utils/jotai";
// import { RenderPrereq } from "./RenderPrereq";

// export function ManagePrereqs() {
//   const [goal, setGoal] = useAtom(goalAtom);
//   const [newPrereq, setNewPrereq] = useAtom(newPrereqAtom);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [isAdding, setIsAdding] = useState(false);
//   const utils = api.useContext();

//   const { data: links } = api.link.getAllUnderGoal.useQuery({
//     parentGoalId: goal?.id ?? "",
//   });

//   // ADDING NEW TO-DOS
//   const [newGoal, setNewGoal] = useState("");
//   const { mutateAsync: createPrereqs } = api.link.createChildren.useMutation({
//     onSuccess(data) {
//       // Invalidate links
//       utils.link.getAllUnderGoal
//         .invalidate({
//           parentGoalId: goal?.id ?? "",
//         })
//         .catch(handleError);
//     },
//   });

//   // REACT DND BELOW
//   const sensors = useSensors(useSensor(PointerSensor));

//   const linkItemsSortKeys = useMemo(() => {
//     return links?.map((link) => link.id) ?? [];
//   }, [links]);

//   const { mutateAsync: updateLexoRankIndex } = api.link.update.useMutation({
//     onMutate: async ({ id, lexoRankIndex }) => {
//       // Cancel outgoing fetches (so they don't overwrite our optimistic update)
//       const query = utils.link.getAllUnderGoal;

//       await query.cancel({ parentGoalId: goal?.id ?? "" });

//       // Get the data from the queryCache
//       const prevData = query.getData({ parentGoalId: goal?.id ?? "" });

//       const newLinks =
//         prevData
//           ?.map((o) => {
//             if (o.id === id) {
//               return {
//                 ...o,
//                 lexoRankIndex: lexoRankIndex ?? o.lexoRankIndex,
//               };
//             } else {
//               return o;
//             }
//           })
//           .sort((a, b) => {
//             if (a.lexoRankIndex < b.lexoRankIndex) {
//               return -1;
//             } else if (a.lexoRankIndex > b.lexoRankIndex) {
//               return 1;
//             } else {
//               return 0;
//             }
//           }) ?? [];

//       query.setData({ parentGoalId: goal?.id ?? "" }, (goal) => {
//         if (!goal) return goal;
//         return newLinks;
//       });

//       return { prevData };
//     },
//     onError(err, newPost, ctx) {
//       // If the mutation fails, use the context-value from onMutate
//       utils.link.getAllUnderGoal.setData(
//         { parentGoalId: goal?.id ?? "" },
//         ctx?.prevData
//       );
//     },
//     onSettled() {
//       // Sync with server once mutation has settled
//       utils.link.getAllUnderGoal
//         .invalidate({ parentGoalId: goal?.id ?? "" })
//         .catch(handleError);
//     },
//   });

//   const handleDragEnd = useCallback(
//     (event: DragEndEvent) => {
//       const { active, over } = event;

//       if (!active || !over || !links) {
//         return;
//       }

//       if (active.id !== over.id) {
//         const oldIndex = links.findIndex((link) => {
//           return link.id === active.id;
//         }); // Index that active item is being dragged from
//         const newIndex = links.findIndex((link) => {
//           return link.id === over.id;
//         }); // Index that active item is being dropped into
//         const newArray = arrayMove(links, oldIndex, newIndex);

//         const beforeNewIndex = newArray[newIndex - 1]?.lexoRankIndex ?? null;
//         const afterNewIndex = newArray[newIndex + 1]?.lexoRankIndex ?? null;

//         const betweenIndex = getLexoRankIndexBetween(
//           beforeNewIndex,
//           afterNewIndex
//         );

//         updateLexoRankIndex({
//           id: active.id as string,
//           lexoRankIndex: betweenIndex,
//         }).catch(handleError);
//       }
//     },
//     [links, updateLexoRankIndex]
//   );

//   return (
//     <div>
//       <div className="flex items-center">
//         <div className="text-2xl font-bold">To-do</div>
//         <IconButton
//           icon={isEditMode ? SolidPencilSquareIcon : PencilSquareIcon}
//           className={clsx({
//             "ml-1": true,
//             "text-gray-500": !isEditMode,
//           })}
//           tooltipText={isEditMode ? "Done Editing" : "Edit To-dos"}
//           onClick={() => {
//             setIsEditMode((prev) => !prev);
//           }}
//         />
//         <IconButton
//           icon={isAdding ? SolidDocumentPlusIcon : DocumentPlusIcon}
//           className={clsx({
//             "ml-1": true,
//             "text-gray-500": !isAdding,
//           })}
//           tooltipText={isAdding ? "Done Adding" : "Add To-dos"}
//           onClick={() => {
//             setIsAdding((prev) => !prev);
//           }}
//         />
//       </div>
//       <div className="h-4"></div>
//       <div className="flex flex-col gap-2">
//         {links?.length === 0 && (
//           <div className="text-gray-500">
//             No items yet. Try asking for to-do items in the chat below!
//           </div>
//         )}
//         <DndContext
//           sensors={sensors}
//           collisionDetection={closestCenter}
//           onDragEnd={handleDragEnd}
//         >
//           <SortableContext
//             items={linkItemsSortKeys}
//             strategy={verticalListSortingStrategy}
//           >
//             {links?.map((link) => {
//               return (
//                 <Fade key={link.id}>
//                   <RenderPrereq
//                     linkId={link.id}
//                     goalId={link.childId}
//                     parentGoalId={link.parentId}
//                     isEditMode={isEditMode}
//                   />
//                 </Fade>
//               );
//             })}
//           </SortableContext>
//         </DndContext>
//         {isAdding && (
//           <div className="pl-6">
//             <div className="flex w-full flex-1 items-center justify-between rounded-sm bg-white/30 px-3 py-2 text-left font-medium transition-all">
//               <ReactTextareaAutosize
//                 minRows={1}
//                 className={clsx({
//                   "mr-1 w-full resize-none rounded-sm bg-transparent px-1 outline-none":
//                     true,
//                   "ring-1 ring-gray-300 focus:ring-gray-500": isAdding,
//                 })}
//                 placeholder="Add a to-do"
//                 value={newGoal}
//                 onChange={(e) => {
//                   setNewGoal(e.target.value);
//                 }}
//               />
//               <IconButton
//                 icon={PlusIcon}
//                 onClick={() => {
//                   if (!goal) return;
//                   createPrereqs({
//                     parentGoalId: goal.id,
//                     goalTitles: [newGoal],
//                   }).catch(handleError);
//                   setNewGoal("");
//                 }}
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
