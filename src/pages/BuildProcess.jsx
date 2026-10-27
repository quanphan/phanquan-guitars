import { processStages } from "../data/buildProcess.js";
import EditablePublicPage from "../components/page-content/EditablePublicPage.jsx";

const processFallbacks = Object.fromEntries(
  processStages.map((stage) => [`process-${stage.id}`, { src: stage.image }]),
);

export default function BuildProcess() {
  return <EditablePublicPage pageKey="build-process" fallbacks={processFallbacks} />;
}
