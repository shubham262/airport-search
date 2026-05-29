import api from "./index";
export const search = async (query) => {
	try {
		const { data } = await api.get(`/api/airports/search?query=${searchQuery}`);
		return data;
	} catch (error) {
		throw error;
	}
};
