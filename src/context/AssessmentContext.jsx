import { createContext, useContext, useReducer } from 'react';

const Ctx = createContext(null);

const init = {
  userId: null, fullName: '',
  questions: null,
  answers: { A: {}, B: {}, C: {} },
  currentSection: 'A',
  currentQuestionIndex: 0,
  behavior: { changes: {}, firstAnswerTime: {}, pauses: 0, lastActivity: Date.now(), sectionTimes: {} },
  results: null,
  startedAt: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, userId: action.id, fullName: action.name };

    case 'SET_QUESTIONS':
      return { ...state, questions: action.questions };

    case 'SET_STARTED':
      return { ...state, startedAt: new Date().toISOString() };

    case 'SET_SECTION':
      return { ...state, currentSection: action.section, currentQuestionIndex: 0 };

    case 'SET_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.index };

    case 'RECORD_ANSWER': {
      const { section, qid, val } = action;
      const prev = state.answers[section][qid];
      const changes = { ...state.behavior.changes };
      if (prev === undefined) state.behavior.firstAnswerTime[qid] = Date.now();
      else changes[qid] = (changes[qid] || 0) + 1;
      const now = Date.now();
      const pauses = (now - state.behavior.lastActivity > 60000)
        ? state.behavior.pauses + 1
        : state.behavior.pauses;
      return {
        ...state,
        answers: { ...state.answers, [section]: { ...state.answers[section], [qid]: val } },
        behavior: { ...state.behavior, changes, pauses, lastActivity: now }
      };
    }

    case 'SET_SECTION_TIME': {
      const sectionTimes = { ...state.behavior.sectionTimes, [`section_${action.section}_minutes`]: action.minutes };
      return { ...state, behavior: { ...state.behavior, sectionTimes } };
    }

    // Restore full state after fetching /api/assessment/resume
    case 'RESTORE_PROGRESS':
      return {
        ...state,
        answers: {
          A: action.answersA || {},
          B: action.answersB || {},
          C: action.answersC || {}
        },
        currentSection:       action.currentSection       || 'A',
        currentQuestionIndex: action.currentQuestionIndex || 0,
        startedAt:            action.startedAt            || null,
        behavior: {
          ...state.behavior,
          sessionPauses: action.behaviorSnapshot?.sessionPauses || 0,
          sectionTimes:  action.behaviorSnapshot?.sectionTimes  || {}
        }
      };

    // Lightweight hint from login response (section + index only — full answers fetched later)
    case 'HINT_RESUME':
      return {
        ...state,
        currentSection:       action.currentSection       || 'A',
        currentQuestionIndex: action.currentQuestionIndex || 0
      };

    case 'SET_RESULTS':
      return { ...state, results: action.results };

    case 'RESET':
      return { ...init, behavior: { ...init.behavior, lastActivity: Date.now() } };

    default:
      return state;
  }
}

export function AssessmentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);

  const buildBehaviorPayload = () => {
    const changes = Object.values(state.behavior.changes);
    const avgChanges = changes.length > 0
      ? changes.reduce((a, b) => a + b, 0) / changes.length
      : 0;

    const PAIRS = [['A01','A03'],['A06','A10'],['A11','A12'],['A16','A15'],['A21','A22'],['A25','A27'],['A31','A35'],['A36','A37'],['A41','A42'],['A45','A49']];
    const semanticPairResults = PAIRS
      .filter(([f, r]) => state.answers.A[f] && state.answers.A[r])
      .map(([f, r]) => ({ match: Math.abs(state.answers.A[f] - (6 - state.answers.A[r])) <= 2 }));

    return {
      avgAnswerChanges:    parseFloat(avgChanges.toFixed(2)),
      sessionPauses:       state.behavior.pauses,
      sectionTimes:        state.behavior.sectionTimes,
      totalAnswered:       Object.keys(state.answers.A).length + Object.keys(state.answers.B).length + Object.keys(state.answers.C).length,
      semanticPairResults
    };
  };

  return (
    <Ctx.Provider value={{ state, dispatch, buildBehaviorPayload }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAssessment = () => useContext(Ctx);
