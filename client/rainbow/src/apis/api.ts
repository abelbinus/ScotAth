
import { getAxiosInstance } from ".";
import { ILoginValues } from "../modals/LoginValues";

// Login API endpoint
export function loginAPI(loginValues: ILoginValues) {
    const request=getAxiosInstance();
  return request({
    method: 'POST',
    url: '/api/login', // Adjust URL if necessary
    data: loginValues,
  });
}

// all user
export function logoutAPI() {
    const request=getAxiosInstance();
    return request({
        url: "/api/authentication/logout",
        method: "GET",
    });
}

// Update a specific user
export function updateUserAPI(user: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/user/`,
        method: "PUT",
        data: user,
    })
}

// Get all meets list
export function getMeetsAPI() {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/meet`,
        method: "GET",
    });
}

// Get all meets list
export function getMeetByIdAPI(meetId: string) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/meet/${meetId}`,
        method: "GET",
    });
}

// Update a specific meet
export function updateMeetAPI(meet: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/meet`,
        method: "PUT",
        data: meet,
    })
}

// user
export function changePasswordAPI(password: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/user/changePassword/`,
        method: "POST",
        data: password,
    });
}

// user
export function getUserByIdAPI(userId: number) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "GET",
    });
}

// admin
export function getAllUsersAPI() {
    const request=getAxiosInstance();
    return request({
        url: "/api/rainbow/user",
        method: "GET",
    });
}

// admin
export function addUserAPI(user: any) {
    const request=getAxiosInstance();
    return request({
        url: "/api/rainbow/user",
        method: "POST",
        data: user,
    });
}

// admin
export function deleteUserAPI(userId: number) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "DELETE",
    });
}

// admin
export function addMeetAPI(meet: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/meet`,
        method: "POST",
        data: meet,
    })
}

// admin
export function deleteMeetAPI(meetId: number) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/meet/${meetId}`,
        method: "DELETE",
    })
}

// get all event details from folder
export function getEventFiles(folderParams: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/event/`,
        method: "POST",
        data: folderParams,
    })
}

// get all event details from folder
export function getEventbyMeetId(meetId: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/eventinfo/${meetId}`,
        method: "GET",
    })
}

// get all event details from folder
export function getAthletebyEventId(meetId: any, eventCode: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/event/${meetId}/${eventCode}`,
        method: "GET",
    })
}

// get all event details from folder
export function postPFEventbyEventId(folderParams: any) {
    const request=getAxiosInstance();
    console.log("folderParams");
    return request({
        url: `/api/rainbow/pfevent/`,
        method: "POST",
        data: folderParams,
    })
}

// update all event details
export function updateEventAPI(eventGroup: any) {
    const request=getAxiosInstance();
    console.log("eventGroup");
    return request({
        url: `/api/rainbow/updateEventAPI/`,
        method: "POST",
        data: eventGroup,
    })
}

// update all event details
export function updateAthleteAPI(eventGroup: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/updateAthleteAPI/`,
        method: "POST",
        data: eventGroup,
    })
}

// get all event photos
export function getEventPhoto(photoParams: any) {
    const request=getAxiosInstance();
    return request({
        url: `/api/rainbow/getEventPhotoAPI/`,
        method: "POST",
        data: photoParams,
    })
}