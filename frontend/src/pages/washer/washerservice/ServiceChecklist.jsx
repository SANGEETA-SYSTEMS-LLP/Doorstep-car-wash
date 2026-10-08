import { Check, Clock3, Sparkles } from "lucide-react";
import { serviceTasks } from "./data";

function ServiceChecklist({ activeJob, completedTasks, toggleTask, allTasksCompleted, moveToAfterPhotos }) {
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
                {serviceTasks.map((task) => {
                  const completed =
                    completedTasks.includes(
                      task
                    );

                  return (
                    <button
                      key={task}
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
                        {task}
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
                  Service timer
                </p>

                <p className="mt-1 text-3xl font-bold">
                  32:18
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
                  {serviceTasks.length}
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${
                        (completedTasks.length /
                          serviceTasks.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-bold text-amber-800">
                  Need an extra charge?
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Additional work must be approved by the
                  supervisor and customer.
                </p>

                <button className="mt-4 w-full rounded-xl border border-amber-300 bg-white py-3 text-sm font-bold text-amber-700">
                  Request Extra Charge
                </button>
              </div>
            </aside>
          </section>
  );
}

export default ServiceChecklist;
