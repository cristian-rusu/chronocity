import { useMemo } from 'react';
import { useScenario } from '../contexts/scenario-management/public-api';
import {
  blankPolicy,
  optimize,
  policyCost,
  policyOptions,
  population,
  network,
} from '../contexts/urban-intelligence/public-api';
import styles from './Page.module.css';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import { useJourney } from '../app/model';
import { Playback } from '../shared/ui/Playback';

function download(data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'chronocity-scenario.json';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CityLabPage() {
  const { disrupted } = useJourney();
  const incident = useScenario((state) => state.incident);
  const policy = useScenario((state) => state.policy);
  const budget = useScenario((state) => state.budget);
  const objective = useScenario((state) => state.objective);
  const updatePolicy = useScenario((state) => state.updatePolicy);
  const setBudget = useScenario((state) => state.setBudget);
  const setObjective = useScenario((state) => state.setObjective);
  const result = useMemo(() => population(incident, policy), [incident, policy]);
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>04 / Urban intelligence</span>
        <h1>What if the city adapts?</h1>
        <p>
          Compare citizen adaptation with changes to public infrastructure. Every result comes from
          the journeys of 60 fictional residents.
        </p>
      </section>
      <div className={styles.metrics}>
        <div>
          <span>Normal city</span>
          <strong>{result.base.percent}%</strong>
          <small>
            {result.base.done}/{result.base.total} feasible visits
          </small>
        </div>
        <div>
          <span>Aftershock</span>
          <strong>{result.disrupted.percent}%</strong>
          <small>{result.affected} residents affected</small>
        </div>
        <div>
          <span>Citizen Re-Sync</span>
          <strong>{result.adapt.percent}%</strong>
          <small>Without city intervention</small>
        </div>
        <div>
          <span>With city policy</span>
          <strong>{result.improved.percent}%</strong>
          <small>
            {result.improved.done - result.adapt.done >= 0 ? '+' : ''}
            {result.improved.done - result.adapt.done} additional visits
          </small>
        </div>
      </div>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Municipal interventions</h2>
          <p>
            Cost: {policyCost(policy)} / {budget} credits
          </p>
          <div className={styles.fields}>
            {policyOptions.map((option) => (
              <label key={option.id}>
                <span>
                  <input
                    type="checkbox"
                    checked={policy[option.id]}
                    disabled={!policy[option.id] && policyCost(policy) + option.cost > budget}
                    onChange={(event) =>
                      updatePolicy({ ...policy, [option.id]: event.target.checked })
                    }
                  />{' '}
                  {option.title} · {option.cost} credits
                </span>
                <small>{option.description}</small>
              </label>
            ))}
            <label>
              Budget
              <input
                type="number"
                min="0"
                max="9"
                value={budget}
                onChange={(event) =>
                  setBudget(Math.max(0, Math.min(9, Number(event.target.value))))
                }
              />
            </label>
            <label>
              Optimization goal
              <select
                value={objective}
                onChange={(event) =>
                  setObjective(event.target.value === 'equity' ? 'equity' : 'access')
                }
              >
                <option value="access">Maximize total accessibility</option>
                <option value="equity">Prioritize worst-served group</option>
              </select>
            </label>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => updatePolicy(optimize(incident, budget, objective))}
              >
                Optimize within budget
              </button>
              <button type="button" onClick={() => updatePolicy(blankPolicy)}>
                Clear policies
              </button>
            </div>
          </div>
        </section>
        <section className={styles.card}>
          <h2>Population access</h2>
          <div className={styles.cards}>
            <div>
              <strong className={styles.stat}>{result.base.percent}%</strong>
              <p>Original</p>
            </div>
            <div>
              <strong className={styles.stat}>{result.disrupted.percent}%</strong>
              <p>Aftershock</p>
            </div>
            <div>
              <strong className={styles.stat}>{result.adapt.percent}%</strong>
              <p>Citizen adaptation</p>
            </div>
            <div>
              <strong className={styles.stat}>{result.improved.percent}%</strong>
              <p>With policy</p>
            </div>
          </div>
          <p>
            {result.affected} residents lose an obligation after the disruption. Group access gap:{' '}
            {result.gapBefore} → {result.gapAfter} percentage points.
          </p>
          <button
            type="button"
            onClick={() => download({ incident, policy, budget, objective, metrics: result })}
          >
            Export scenario JSON
          </button>
        </section>
      </div>
      <div className={styles.grid}>
        <div>
          <CityMap
            result={result.rows[0]?.improved ?? disrupted}
            incident={incident}
            cityData={network(policy)}
            residentResults={result.rows.flatMap((row) => row.improved ? [row.improved] : [])}
          />
          <Playback start={Math.min(...result.rows.map((row) => row.plan.startTime))} end={Math.max(...result.rows.map((row) => row.improved?.finish ?? row.disrupted.finish))} />
        </div>
        <section className={styles.card}>
          <span className={styles.kicker}>TEMPORAL EQUITY</span>
          <h2>Who gets access back?</h2>
          <p>
            Accessibility is the share of required visits residents can complete. Group gap:{' '}
            {result.gapBefore} → {result.gapAfter} percentage points.
          </p>
          {result.groups.map((group) => (
            <div className={styles.groupBars} key={group.name}>
              <strong>{group.name}</strong>
              {(
                [
                  { label: 'Aftershock', value: group.disrupted },
                  { label: 'Re-Sync', value: group.adapt },
                  { label: 'Policy', value: group.improved },
                ] as const
              ).map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div className={styles.bar}>
                    <i style={{ width: `${item.value}%` }} />
                  </div>
                  <b>{item.value}%</b>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
      <section className={styles.card}>
        <span className={styles.kicker}>GROUP COMPARISON</span>
        <h2>Citizen groups</h2>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Group</th>
                <th>Original</th>
                <th>Aftershock</th>
                <th>Adaptation</th>
                <th>Policy</th>
              </tr>
            </thead>
            <tbody>
              {result.groups.map((group) => (
                <tr key={group.name}>
                  <th>{group.name}</th>
                  <td>{group.baseline}%</td>
                  <td>{group.disrupted}%</td>
                  <td>{group.adapt}%</td>
                  <td>{group.improved}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.card}>
        <span className={styles.kicker}>BEHIND THE NUMBERS</span>
        <h2>Resident-level impact</h2>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Resident</th>
                <th>Original</th>
                <th>Aftershock</th>
                <th>Re-Sync</th>
                <th>Policy</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <th>{row.name}</th>
                  <td>{row.base.completed}</td>
                  <td>{row.disrupted.completed}</td>
                  <td>{row.adapt?.completed ?? 0}</td>
                  <td>{row.improved?.completed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
