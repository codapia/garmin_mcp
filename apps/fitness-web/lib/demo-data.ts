export type WorkoutStep = {
  id: string;
  name: string;
  garmin: string;
  group: "Activación" | "Fuerza" | "Core" | "Cardio";
  series: string;
  reps: string;
  load: string;
  rest: string;
  visual: "press" | "squat" | "row" | "hinge" | "deadbug" | "bike";
  technique: string[];
  mistakes: string[];
  safety: string;
};

export const workout: WorkoutStep[] = [
  { id:"press", name:"Press inclinado con mancuernas", garmin:"BENCH_PRESS / INCLINE_DUMBBELL_BENCH_PRESS", group:"Fuerza", series:"3", reps:"10", load:"8 kg por mano", rest:"75 s", visual:"press",
    technique:["Inclina el banco aproximadamente 30° y apoya la espalda.","Baja ambas mancuernas de manera controlada hasta una posición cómoda.","Presiona hacia arriba sin perder la estabilidad de los hombros."],
    mistakes:["Arquear excesivamente la espalda.","Bajar los brazos demasiado o chocar las mancuernas arriba."],
    safety:"Si aparece dolor de hombro, reduce la amplitud o detén el ejercicio. Revisa que el banco quede bloqueado." },
  { id:"squat", name:"Sentadilla goblet", garmin:"SQUAT / GOBLET_SQUAT", group:"Fuerza", series:"3", reps:"10", load:"8 kg", rest:"75 s", visual:"squat",
    technique:["Sujeta una mancuerna cerca del pecho.","Flexiona caderas y rodillas manteniendo el tronco estable.","Empuja el suelo para volver a subir."],
    mistakes:["Despegar los talones del suelo.","Dejar caer el torso o hundir las rodillas hacia dentro."],
    safety:"Usa una profundidad sin dolor y mantén controlado el equilibrio." },
  { id:"row", name:"Remo con banda elástica", garmin:"BANDED_EXERCISES / ROW", group:"Fuerza", series:"3", reps:"12", load:"Banda media", rest:"60 s", visual:"row",
    technique:["Ancla la banda firmemente y extiende los brazos.","Lleva los codos hacia atrás acercando las manos al torso.","Regresa lento sin encoger los hombros."],
    mistakes:["Balancear el tronco.","Llevar los hombros hacia las orejas."],
    safety:"Comprueba que la banda no esté dañada y que el anclaje sea seguro." },
  { id:"hinge", name:"Peso muerto con mancuernas", garmin:"DEADLIFT / DUMBBELL_DEADLIFT", group:"Fuerza", series:"3", reps:"10", load:"8 kg por mano", rest:"75 s", visual:"hinge",
    technique:["Coloca las mancuernas a los lados y activa el abdomen.","Empuja la cadera hacia atrás manteniendo la columna neutra.","Sube extendiendo la cadera sin inclinarte hacia atrás."],
    mistakes:["Redondear la espalda por buscar más profundidad.","Alejar las mancuernas del cuerpo."],
    safety:"No fuerces el rango si notas dolor lumbar; reduce carga y consulta si persiste." },
  { id:"deadbug", name:"Dead bug (insecto muerto)", garmin:"HIP_STABILITY / DEAD_BUG", group:"Core", series:"2", reps:"8 por lado", load:"Sin peso", rest:"45 s", visual:"deadbug",
    technique:["Túmbate boca arriba con brazos y rodillas elevados.","Extiende despacio un brazo y la pierna contraria.","Vuelve al centro y alterna sin arquear la zona lumbar."],
    mistakes:["Separar la zona lumbar del suelo.","Mover ambos lados simultáneamente o demasiado rápido."],
    safety:"Reduce la amplitud si pierdes el control abdominal." },
  { id:"bike", name:"Bicicleta estática", garmin:"Actividad Garmin: indoor_cycling", group:"Cardio", series:"1", reps:"8 minutos", load:"Ritmo conversacional", rest:"—", visual:"bike",
    technique:["Ajusta la altura del sillín para no bloquear la rodilla.","Pedalea con cadencia cómoda y hombros relajados.","Finaliza disminuyendo gradualmente el esfuerzo."],
    mistakes:["Balancear las caderas.","Usar una resistencia demasiado alta al comenzar."],
    safety:"Detente si aparece mareo, dolor torácico o falta de aire inusual." },
];

export type GarminExercise = { name:string; nameEn:string; category:string; code:string; muscle:string; equipment:string; visual:WorkoutStep["visual"] };
export const exerciseCatalog: GarminExercise[] = [
  {name:"Curl de bíceps con banda",nameEn:"Banded Curl",category:"BANDED_EXERCISES",code:"CURL",muscle:"Bíceps",equipment:"Banda",visual:"row"},
  {name:"Remo con banda",nameEn:"Banded Row",category:"BANDED_EXERCISES",code:"ROW",muscle:"Espalda",equipment:"Banda",visual:"row"},
  {name:"Sentadilla con banda",nameEn:"Banded Squat",category:"BANDED_EXERCISES",code:"SQUAT",muscle:"Piernas",equipment:"Banda",visual:"squat"},
  {name:"Peso muerto con banda",nameEn:"Banded Deadlift",category:"BANDED_EXERCISES",code:"DEADLIFT",muscle:"Piernas",equipment:"Banda",visual:"hinge"},
  {name:"Puente de glúteos con banda",nameEn:"Banded Glute Bridge",category:"BANDED_EXERCISES",code:"GLUTE_BRIDGE",muscle:"Glúteos",equipment:"Banda",visual:"hinge"},
  {name:"Plancha con banda",nameEn:"Banded Plank",category:"BANDED_EXERCISES",code:"PLANK",muscle:"Core",equipment:"Banda",visual:"deadbug"},
  {name:"Zancada con banda",nameEn:"Banded Lunge",category:"BANDED_EXERCISES",code:"LUNGE",muscle:"Piernas",equipment:"Banda",visual:"squat"},
  {name:"Dead bug con banda",nameEn:"Banded Deadbug",category:"BANDED_EXERCISES",code:"DEADBUG",muscle:"Core",equipment:"Banda",visual:"deadbug"},
  {name:"Apertura de banda",nameEn:"Banded Pull Apart",category:"BANDED_EXERCISES",code:"PULL_APART",muscle:"Hombros",equipment:"Banda",visual:"row"},
  {name:"Caminata lateral con banda",nameEn:"Banded Lateral Band Walks",category:"BANDED_EXERCISES",code:"LATERAL_BAND_WALKS",muscle:"Glúteos",equipment:"Banda",visual:"squat"},
  {name:"Press de pecho con mancuernas",nameEn:"Dumbbell Bench Press",category:"BENCH_PRESS",code:"DUMBBELL_BENCH_PRESS",muscle:"Pecho",equipment:"Banco y mancuernas",visual:"press"},
  {name:"Press alternado con mancuernas",nameEn:"Alternating Dumbbell Chest Press",category:"BENCH_PRESS",code:"ALTERNATING_DUMBBELL_CHEST_PRESS",muscle:"Pecho",equipment:"Banco y mancuernas",visual:"press"},
  {name:"Press de pecho con barra",nameEn:"Barbell Bench Press",category:"BENCH_PRESS",code:"BARBELL_BENCH_PRESS",muscle:"Pecho",equipment:"Barra",visual:"press"},
  {name:"Press con barra en suelo",nameEn:"Barbell Floor Press",category:"BENCH_PRESS",code:"BARBELL_FLOOR_PRESS",muscle:"Pecho",equipment:"Barra",visual:"press"},
  {name:"Press de pecho",nameEn:"Bench Press",category:"BENCH_PRESS",code:"BENCH_PRESS",muscle:"Pecho",equipment:"Sin especificar",visual:"press"},
  {name:"Peso muerto con mancuernas",nameEn:"Dumbbell Deadlift",category:"DEADLIFT",code:"DUMBBELL_DEADLIFT",muscle:"Piernas",equipment:"Mancuernas",visual:"hinge"},
  {name:"Peso muerto con kettlebell",nameEn:"Kettlebell Deadlift",category:"DEADLIFT",code:"KETTLEBELL_DEADLIFT",muscle:"Piernas",equipment:"Kettlebell",visual:"hinge"},
  {name:"Peso muerto sumo con kettlebell",nameEn:"Kettlebell Sumo Deadlift",category:"DEADLIFT",code:"KETTLEBELL_SUMO_DEADLIFT",muscle:"Piernas",equipment:"Kettlebell",visual:"hinge"},
  {name:"Peso muerto rumano",nameEn:"Romanian Deadlift",category:"DEADLIFT",code:"ROMANIAN_DEADLIFT",muscle:"Piernas",equipment:"Barra",visual:"hinge"},
  {name:"Peso muerto piernas rectas",nameEn:"Dumbbell Straight-leg Deadlift",category:"DEADLIFT",code:"DUMBBELL_STRAIGHT_LEG_DEADLIFT",muscle:"Piernas",equipment:"Mancuernas",visual:"hinge"},
  {name:"Curl bíceps alternado",nameEn:"Alternating Dumbbell Biceps Curl",category:"CURL",code:"ALTERNATING_DUMBBELL_BICEPS_CURL",muscle:"Bíceps",equipment:"Mancuernas",visual:"row"},
  {name:"Curl bíceps inclinado",nameEn:"Alternating Incline Dumbbell Biceps Curl",category:"CURL",code:"ALTERNATING_INCLINE_DUMBBELL_BICEPS_CURL",muscle:"Bíceps",equipment:"Banco y mancuernas",visual:"row"},
  {name:"Curl de bíceps con barra",nameEn:"Barbell Biceps Curl",category:"CURL",code:"BARBELL_BICEPS_CURL",muscle:"Bíceps",equipment:"Barra",visual:"row"},
  {name:"Zancada alternada con mancuernas",nameEn:"Alternating Dumbbell Lunge",category:"LUNGE",code:"ALTERNATING_DUMBBELL_LUNGE",muscle:"Piernas",equipment:"Mancuernas",visual:"squat"},
  {name:"Sentadilla búlgara con mancuernas",nameEn:"Back-foot Elevated Dumbbell Split Squat",category:"LUNGE",code:"BACK_FOOT_ELEVATED_DUMBBELL_SPLIT_SQUAT",muscle:"Piernas",equipment:"Banco y mancuernas",visual:"squat"},
  {name:"Flexión diamante",nameEn:"Diamond Push-up",category:"PUSH_UP",code:"DIAMOND_PUSH_UP",muscle:"Pecho",equipment:"Peso corporal",visual:"press"},
  {name:"Flexión declinada",nameEn:"Decline Push-up",category:"PUSH_UP",code:"DECLINE_PUSH_UP",muscle:"Pecho",equipment:"Banco",visual:"press"},
  {name:"Flexión con banda",nameEn:"Banded Push-ups",category:"BANDED_EXERCISES",code:"PUSH_UPS",muscle:"Pecho",equipment:"Banda",visual:"press"},
  {name:"Remo suspendido",nameEn:"Suspended Row",category:"LATERAL_RAISE",code:"SUSPENDED_ROW",muscle:"Espalda",equipment:"Barra/suspensión",visual:"row"},
  {name:"Remo con banda a un brazo",nameEn:"One-arm Row with Band",category:"HYPEREXTENSION",code:"ONE_ARM_ROW_WITH_BAND",muscle:"Espalda",equipment:"Banda",visual:"row"},
  {name:"Plancha con pies elevados",nameEn:"Elevated-feet Plank",category:"PLANK",code:"ELEVATED_FEET_PLANK",muscle:"Core",equipment:"Banco",visual:"deadbug"},
  {name:"Gateo de oso",nameEn:"Bear Crawl",category:"PLANK",code:"BEAR_CRAWL",muscle:"Core",equipment:"Peso corporal",visual:"deadbug"},
  {name:"Giro con balón medicinal",nameEn:"Medicine Ball Side Throw",category:"PLYO",code:"MEDICINE_BALL_SIDE_THROW",muscle:"Core",equipment:"Balón medicinal",visual:"row"},
];

export type DemoDay = {date:string;steps:number;sleep:number;sleepScore:number;battery:number;stress:number;hrv:number;restingHR:number;trainingMin:number;activeKcal:number;protein:number|null;foodKcal:number|null;training:string;meals:string[]};
export const history: DemoDay[] = [
  {date:"2026-10-25",steps:6850,sleep:7.3,sleepScore:81,battery:84,stress:22,hrv:61,restingHR:54,trainingMin:40,activeKcal:340,protein:118,foodKcal:2020,training:"Fuerza superior",meals:["Huevos, palta y pan","Lentejas con arroz","Yogur y nueces"]},
  {date:"2026-10-26",steps:5300,sleep:6.6,sleepScore:73,battery:71,stress:35,hrv:57,restingHR:55,trainingMin:0,activeKcal:175,protein:null,foodKcal:null,training:"Descanso",meals:["Registro parcial"]},
  {date:"2026-10-27",steps:7930,sleep:7.8,sleepScore:86,battery:88,stress:18,hrv:64,restingHR:51,trainingMin:45,activeKcal:390,protein:127,foodKcal:2130,training:"Fuerza total",meals:["Avena y huevos","Seitán y verduras","Leche cultivada"]},
  {date:"2026-10-28",steps:6170,sleep:5.9,sleepScore:72,battery:60,stress:27,hrv:64,restingHR:51,trainingMin:28,activeKcal:212,protein:105,foodKcal:1950,training:"Fuerza + bicicleta",meals:["Pan con palta y queso","Torta de verduras","Yogur"]},
  {date:"2026-10-29",steps:4200,sleep:7.1,sleepScore:79,battery:73,stress:20,hrv:59,restingHR:53,trainingMin:0,activeKcal:135,protein:null,foodKcal:null,training:"Descanso",meals:["Sin registro completo"]},
  {date:"2026-10-30",steps:7450,sleep:7.5,sleepScore:83,battery:81,stress:21,hrv:63,restingHR:52,trainingMin:50,activeKcal:410,protein:119,foodKcal:2100,training:"Fuerza + cardio",meals:["Pan con palta","Legumbres","Huevos y leche cultivada"]},
  {date:"2026-10-31",steps:8310,sleep:7.0,sleepScore:80,battery:79,stress:19,hrv:65,restingHR:50,trainingMin:35,activeKcal:290,protein:131,foodKcal:2080,training:"Fuerza tren superior",meals:["Pan con palta y queso","Tofu y verduras","Yogur griego"]},
];

export const crosses = [
  {title:"Sueño × disposición",metrics:["Horas de sueño","Readiness"],desc:"Valorar si las noches más reparadoras preceden a sesiones con mejor disposición."},
  {title:"Sueño × rendimiento de fuerza",metrics:["Sueño","Volumen","RPE"],desc:"Contrastar la recuperación con el volumen de trabajo y la dificultad percibida."},
  {title:"Proteína × fuerza",metrics:["Proteína","Carga","Repeticiones"],desc:"Evaluar ingesta proteica y progreso de fuerza a lo largo de varias semanas."},
  {title:"Estrés × Body Battery",metrics:["Estrés","Body Battery"],desc:"Explorar cómo coinciden el estrés diario y la energía estimada."},
  {title:"VFC × carga de entrenamiento",metrics:["VFC","Carga aguda"],desc:"Contrastar tendencias de VFC con cambios de carga, sin asumir causalidad."},
  {title:"Pasos × sueño",metrics:["Pasos","Sueño"],desc:"Relacionar actividad ligera y descanso en días comparables."},
  {title:"Peso × proteína × fuerza",metrics:["Peso","Proteína","Volumen"],desc:"Buscar recomposición sin inferir grasa corporal solo a partir del peso."},
  {title:"Sueño × estrés × VFC",metrics:["Sueño","Estrés","VFC"],desc:"Identificar patrones de recuperación afectados por distintas señales."},
  {title:"Calorías × entrenamiento",metrics:["Ingesta","Gasto activo"],desc:"Evaluar balance estimado con datos completos y margen de incertidumbre."},
  {title:"Body Battery × intensidad",metrics:["Body Battery","FC","RPE"],desc:"Comprobar si la energía percibida y el esfuerzo registrado coinciden."},
  {title:"FC reposo × sueño × carga",metrics:["FC reposo","Sueño","Carga"],desc:"Seguir cambios sostenidos que puedan indicar necesidad de recuperación."},
  {title:"Frecuencia × volumen × fatiga",metrics:["Sesiones","Volumen","Fatiga"],desc:"Detectar si la progresión del entrenamiento se mantiene tolerable."},
  {title:"Proteína × sueño × recuperación",metrics:["Proteína","Sueño","Readiness"],desc:"Cruzar hábitos de alimentación con la recuperación de forma descriptiva."},
  {title:"Pasos × ingesta × peso",metrics:["Pasos","Ingesta","Peso"],desc:"Interpretar cambios de peso junto con hábitos diarios y no de forma aislada."},
  {title:"VFC × estrés × Body Battery × sueño",metrics:["VFC","Estrés","Battery","Sueño"],desc:"Resumen multivariable de recuperación a medio plazo."},
  {title:"Fuerza × energía × proteína × descanso",metrics:["Volumen","Ingesta","Proteína","Sueño"],desc:"Evaluar progresión muscular combinando estímulo, recuperación y alimentación."},
];
