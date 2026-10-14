import { Check, Clock3, Sparkles } from "lucide-react";
import ExtraChargeRequest from "./ExtraChargeRequest";

function ServiceChecklist({ activeJob, checklist, loading, saving, retry, toggleTask, allTasksCompleted, moveToAfterPhotos }) {
  const completedTasks = checklist.filter((item) => item.completed);
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Service In Progress
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {activeJob?.service || "Car Wash"}
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles />
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {loading && <p>Loading checklist...</p>}
                {!loading && !checklist.length && <p>No checklist available. <button onClick={retry}>Retry</button></p>}
                {checklist.map((task) => {
                  const completed =
                    task.completed;

                  return (
                    <button
                      key={task.id}
                      disabled={saving}
                      onClick={() =>
                        toggleTask(task)
                      }
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                        completed
                          ? "border-green-200 bg-green-50"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          completed
                            ? "bg-green-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <Check size={17} />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </div>

                      <span
                        className={`font-semibold ${
                          completed
                            ? "text-green-800"
                            : "text-slate-700"
                        }`}
                      >
                        {(Array.isArray(task.item) ? task.item[0] : task.item)?.title || "Checklist item"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!allTasksCompleted}
                onClick={moveToAfterPhotos}
                className="mt-7 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Finish Service Checklist
              </button>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl bg-blue-600 p-6 text-white">
                <Clock3 />

                <p className="mt-4 text-sm text-blue-100">
                  Service status
                </p>

                <p className="mt-1 text-3xl font-bold">
                  In progress
                </p>

                <p className="mt-2 text-xs text-blue-100">
                  {activeJob?.service || "Car Wash"} in progress
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Tasks completed
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {completedTasks.length}/
                  {checklist.length}
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${
                        (completedTasks.length /
                          (checklist.length || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <ExtraChargeRequest bookingId={activeJob.databaseId} />
            </aside>
          </section>
  );
}

export default ServiceChecklist;
