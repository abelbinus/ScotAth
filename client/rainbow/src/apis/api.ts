import { getAxiosInstance } from ".";
import { ILoginValues } from "../modals/LoginValues";

/**
 * Makes an API call to the login endpoint.
 * @param {ILoginValues} loginValues - The login credentials.
 * @returns {Promise} The API response.
 */
export function loginAPI(loginValues: ILoginValues) {
    const request = getAxiosInstance();
    return request({
        method: 'POST',
        url: '/api/login', // Adjust URL if necessary
        data: loginValues,
    });
}

/**
 * Makes an API call to the logout endpoint.
 * @returns {Promise} The API response.
 */
export function logoutAPI() {
    const request = getAxiosInstance();
    return request({
        url: "/api/authentication/logout",
        method: "GET",
    });
}

/**
 * Updates a specific user.
 * @param {any} user - The user data to update.
 * @returns {Promise} The API response.
 */
export function updateUserAPI(user: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/user/`,
        method: "PUT",
        data: user,
    });
}

/**
 * Retrieves the list of all meets.
 * @returns {Promise} The API response.
 */
export function getMeetsAPI() {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/meet`,
        method: "GET",
    });
}

/**
 * Retrieves a specific meet by its ID.
 * @param {string} meetId - The ID of the meet.
 * @returns {Promise} The API response.
 */
export function getMeetByIdAPI(meetId: string) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/meet/${meetId}`,
        method: "GET",
    });
}

/**
 * Updates a specific meet.
 * @param {any} meet - The meet data to update.
 * @returns {Promise} The API response.
 */
export function updateMeetAPI(meet: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/meet`,
        method: "PUT",
        data: meet,
    });
}

/**
 * Changes the user's password.
 * @param {any} password - The new password data.
 * @returns {Promise} The API response.
 */
export function changePasswordAPI(password: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/user/changePassword/`,
        method: "POST",
        data: password,
    });
}

/**
 * Retrieves a specific user by their ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} The API response.
 */
export function getUserByIdAPI(userId: number) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "GET",
    });
}

/**
 * Retrieves the list of all users.
 * @returns {Promise} The API response.
 */
export function getAllUsersAPI() {
    const request = getAxiosInstance();
    return request({
        url: "/api/rainbow/user",
        method: "GET",
    });
}

/**
 * Adds a new user.
 * @param {any} user - The user data to add.
 * @returns {Promise} The API response.
 */
export function addUserAPI(user: any) {
    const request = getAxiosInstance();
    return request({
        url: "/api/rainbow/user",
        method: "POST",
        data: user,
    });
}

/**
 * Deletes a specific user by their ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise} The API response.
 */
export function deleteUserAPI(userId: number) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "DELETE",
    });
}

/**
 * Adds a new meet.
 * @param {any} meet - The meet data to add.
 * @returns {Promise} The API response.
 */
export function addMeetAPI(meet: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/meet`,
        method: "POST",
        data: meet,
    });
}

/**
 * Deletes a specific meet by its ID.
 * @param {number} meetId - The ID of the meet.
 * @returns {Promise} The API response.
 */
export function deleteMeetAPI(meetId: number) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/meet/${meetId}`,
        method: "DELETE",
    });
}

/**
 * Retrieves event details from a folder.
 * @param {any} folderParams - The folder parameters.
 * @returns {Promise} The API response.
 */
export function getEventFiles(folderParams: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/event/`,
        method: "POST",
        data: folderParams,
    });
}

/**
 * Retrieves event details by meet ID.
 * @param {any} meetId - The ID of the meet.
 * @returns {Promise} The API response.
 */
export function getEventbyMeetId(meetId: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/eventinfo/${meetId}`,
        method: "GET",
    });
}

/**
 * Retrieves athlete details by meet ID and event code.
 * @param {any} meetId - The ID of the meet.
 * @param {any} eventCode - The event code.
 * @returns {Promise} The API response.
 */
export function getAthletebyEventId(meetId: any, eventCode: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/event/${meetId}/${eventCode}`,
        method: "GET",
    });
}

/**
 * Posts photofinish event details by event ID.
 * @param {any} folderParams - The folder parameters.
 * @returns {Promise} The API response.
 */
export function postPFEventbyEventId(folderParams: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/pfevent/`,
        method: "POST",
        data: folderParams,
    });
}

/**
 * Updates event details.
 * @param {any} eventGroup - The event data to update.
 * @returns {Promise} The API response.
 */
export function updateEventAPI(eventGroup: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/updateEventAPI/`,
        method: "POST",
        data: eventGroup,
    });
}

/**
 * Updates athlete details.
 * @param {any} eventGroup - The athlete data to update.
 * @returns {Promise} The API response.
 */
export function updateAthleteAPI(eventGroup: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/updateAthleteAPI/`,
        method: "POST",
        data: eventGroup,
    });
}

/**
 * Retrieves event photos.
 * @param {any} photoParams - The photo parameters.
 * @returns {Promise} The API response.
 */
export function getEventPhoto(photoParams: any) {
    const request = getAxiosInstance();
    return request({
        url: `/api/rainbow/getEventPhotoAPI/`,
        method: "POST",
        data: photoParams,
    });
}
