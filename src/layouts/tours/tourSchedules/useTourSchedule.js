import { useMutation, useQuery } from "@apollo/client";
import { GET_TOUR_SCHEDULE, SAVE_TOUR_SCHEDULE } from "./tourSchedules.gql";

function cleanScheduleInput(schedule, status) {
  return {
    timeZone: schedule.timeZone,
    status,
    dateVariant: schedule.dateVariant,
    notice: schedule.notice?.trim() || null,
    days: schedule.days.map((day, dayIndex) => ({
      order: dayIndex,
      date: day.date,
      title: day.title.trim(),
      events: day.events.map((event, eventIndex) => ({
        order: eventIndex,
        startTime: event.startTime || null,
        endTime: event.endTime || null,
        title: event.title.trim(),
        location: event.location?.trim() || null,
        audience: event.audience || "ALL",
      })),
    })),
  };
}

export function useTourSchedule(tourId) {
  const { data, loading, error } = useQuery(GET_TOUR_SCHEDULE, {
    variables: { tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });
  const [saveMutation, { loading: saving }] = useMutation(SAVE_TOUR_SCHEDULE, {
    update(cache, { data: result }) {
      const saved = result?.saveTourSchedule;
      if (!saved) return;
      cache.writeQuery({
        query: GET_TOUR_SCHEDULE,
        variables: { tourId },
        data: { getTourSchedule: saved },
      });
    },
  });

  const save = async (schedule, status) => {
    const result = await saveMutation({
      variables: { tourId, input: cleanScheduleInput(schedule, status) },
    });
    return result.data?.saveTourSchedule;
  };

  return {
    schedule: data?.getTourSchedule ?? null,
    loading,
    error,
    saving,
    save,
  };
}
